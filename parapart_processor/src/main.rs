use octocrab::{Octocrab,models,params};
use clap::Parser;
use regex::Regex;
use reqwest;
use rusqlite::{Connection, Result};
use std::fs;
use std::io;
use chrono::prelude::*;
use std::io::prelude::*;
use std::process::Command;
use tempfile::NamedTempFile;
use tokio;

static PNG_PATH: &'static str = "docs/assets/part_images";
static SCAD_PATH: &'static str = "docs/assets/local_scad";
static STL_PATH: &'static str = "docs/assets/local_stl";
static TEMP_STL: &'static str = "/tmp/parapart.stl";
static TEMP_PNG: &'static str = "/tmp/parapart.png";
static GITHUB_BASE: &'static str = "https://raw.githubusercontent.com";
static PARAPART_BASE: &'static str = "https://raw.githubusercontent.com/nbr0wn/parapart/main/assets";


#[derive(Parser, Default, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
   /// Name of the file containing the GitHub token
   #[arg(short='t', long, required(true))]
   token_file: String,

   /// Path to the parapart git repository
   #[arg(short='p', long, required(true))]
   parapart: String,

   /// Path to the openscad executable
   #[arg(short='o', long, required(true))]
   openscad: String,
}


// Process file with openscad
fn openscad_check (args: &Args, temp_file: &NamedTempFile) -> bool {
    // Run OpenSCAD on the scad file
    println!("Running OpenSCAD on {}", temp_file.path().to_str().unwrap());
    let output = Command::new(args.openscad.as_str())
        .arg("--colorscheme")
        .arg("Parapart")
        .arg("--render")
        .arg("--autocenter")
        .arg("--viewall")
        .arg("--imgsize=512x512")
        .arg("-o")
        .arg(TEMP_STL)
        .arg("-o")
        .arg(TEMP_PNG)
        .arg("-q")
        .arg(temp_file.path().to_str().unwrap())
        .output()
        .unwrap();

    io::stdout().write_all(&output.stdout).unwrap();
    io::stderr().write_all(&output.stderr).unwrap();

    // Now replace our ugly bg color with transparency and
    // scale down to our tile size of 128x128
    let convert_output = Command::new("convert")
        .arg(TEMP_PNG)
        .arg("-transparent")
        .arg("#cc00cc")
        .arg("-geometry")
        .arg("128x128")
        .arg(TEMP_PNG)
        .output()
        .unwrap();

        io::stdout().write_all(&output.stdout).unwrap();
        io::stderr().write_all(&output.stderr).unwrap();
    println!("OpenSCAD OUTPUT CREATED: {}", output.status.success());
    return output.status.success();
}

// Fetch raw file text from GitHub
async fn fetch_github_file(user:&str, repo:&str, branch:&str, path:&str ) -> Option<NamedTempFile> {
    // Define the URL of the file to download
    let url = format!("{GITHUB_BASE}/{user}/{repo}/{branch}/{path}");
    println!("{:?}", url);
    if let Ok(response) = reqwest::get(url).await {
        match response.status() {
            reqwest::StatusCode::OK => { 
                let body = response.text().await.unwrap();
                println!("FETCHED: {:?}", body);
                return Some(write_to_temp_file(&body));
            },
            reqwest::StatusCode::NOT_FOUND => {
                println!("NOT FOUND");
            }
            _ => {
                println!("FETCH ERROR");
            }
        }
    }

    //let body = reqwest::get(url).await.unwrap().text().await.unwrap();
    //println!("{:?}", body);

    //return write_to_temp_file(&body)
    None
}

fn write_to_temp_file(content: &str) -> NamedTempFile {
    let mut temp_file = NamedTempFile::new().unwrap();
    temp_file.write_all(content.as_bytes()).unwrap();

    return temp_file
}

fn get_next_seq(db_path: &str) -> u32 {
    let conn = Connection::open(format!("{db_path}")).unwrap();

    let mut stmt = conn.prepare("SELECT seq from sqlite_sequence WHERE name = 'part'").unwrap();
    let mut rows = stmt.query([]).unwrap();
    if let Some(row) = rows.next().unwrap() {
        let seq: u32 = row.get(0).unwrap();
        return seq + 1;
    }
    return 1;
}

fn insert_part(db_path: &str, seq: u32, name:&str, section: &str, url: &str, submitter: &str) -> Result<()> {
    let mut conn = Connection::open(format!("{db_path}")).unwrap();
    let tx = conn.transaction()?;
    tx.execute("INSERT INTO part (name, url, submitter) VALUES (?1, ?2, ?3)",
        (&name, &url, &submitter))?;
    tx.execute("INSERT INTO part_section (part_id, section_id) VALUES (?1, ?2)",
        (&seq, &section))?;
    tx.commit()
}

fn add_record(args: &Args, name: &str, section: &str, url: &str, submitter: &str, 
    local_scad: bool, temp_file: NamedTempFile ) -> bool {
    let seq = get_next_seq(args.parapart.as_str());
    let dir = format!("{:03}", seq / 100);
    let file_base = format!("{:03}", seq % 100);

    println!("seq: {}  dir: {}, file_base: {}", seq, dir, file_base);

    let base = args.parapart.as_str();

    // Copy the PNG and STL files to the assets directory
    fs::create_dir_all(format!("{base}/{PNG_PATH}/{dir}")).unwrap();
    fs::copy(TEMP_PNG, format!("{base}/{PNG_PATH}/{dir}/{file_base}.png")).unwrap();
    fs::create_dir_all(format!("{base}/{STL_PATH}/{dir}")).unwrap();
    fs::copy(TEMP_STL, format!("{base}/{STL_PATH}/{dir}/{file_base}.stl")).unwrap();

    let mut insert_url = url.to_string();


    // If we're dealing with a local SCAD file, we need the parapart URL
    if local_scad {
        // Copy the temp SCAD file over to the assets directory
        fs::create_dir_all(format!("{base}/{SCAD_PATH}/{dir}")).unwrap();
        fs::copy(temp_file.path(), 
            format!("{base}/{SCAD_PATH}/{dir}/{file_base}.scad")).unwrap();

        // Replace our temp filename with the parapart path to the scad file
        let replaced_url = url.replace("temp.scad", format!("/{dir}/{file_base}.scad").as_str());
        insert_url = replaced_url;
    }

    // Insert the part record
    match insert_part(&args.parapart.as_str(), seq, name, section, insert_url.as_str(), submitter) {
        Ok(_) => {},
        Err(e) => { println!("Failed to insert part: {:?}", e); return false; }
    }
    return true;
}

async fn handle_issue<'a>(args: &Args, body: &String, submitter: &str) -> Result<(),&'a str> {
    let mut name = "".to_string();
    let mut section = "".to_string();
    //println!("FULL BODY: {}", body);
    for fields in body.split("\r\n") {
        let tuple: Vec<&str> = fields.split("::").collect();
        match tuple[0] {
            "NAME" => { name = tuple[1].to_string(); },
            "SECTION" => { section = tuple[1].to_string(); },
            "URL" => { 
                if name.is_empty() || section.is_empty()  {
                    return Err("Not a valid SCAD issue type");
                }
                let tempurl = tuple[1].replace("/blob", "");
                // Extract URL elements
                let path_elements: Vec<&str> = tempurl.split("/").collect();
                let user = path_elements[3];
                let repo = path_elements[4];
                let branch = path_elements[5];
                let path = path_elements[6 ..].join("/");

                // Build raw static URL
                let url = format!("{GITHUB_BASE}/{user}/{repo}/{branch}/{path}");

                // Fetch the file locally into a temp file
                if let Some(scad_file) = fetch_github_file(&user, &repo, &branch, &path).await {
                    if openscad_check(&args, &scad_file) {
                        if add_record(&args, name.as_str(), section.as_str(), 
                            url.as_str(), submitter, false,scad_file) {
                            return Ok(());
                        } else {
                            return Err("Failed to add record");
                        }
                    }
                    else {
                        return Err("INVALID OPENSCAD FILE");
                    }
                } else {
                    return Err("INVALID OPENSCAD URL");
                }
            },
            "SCAD" => { 
                if name.is_empty() || section.is_empty()  {
                    return Err("Not a valid SCAD issue type");
                }
                let re = Regex::new(r".*(?sm)```(.*)```.*").unwrap();
                let caps = re.captures(body).unwrap();
                let scad = caps.get(1).map_or("", |m| m.as_str().trim());
                let date = Utc::now().format("%Y-%m-%d").to_string();
                let full_scad = format!("// ADDED BY:{submitter}\r\n// ADD DATE:{date}\r\n{scad}");
                // Extract the scad script
                println!("SCAD SCRIPT: {:?}", full_scad);
                // Write the scad script to the temp file
                let scad_file:NamedTempFile = write_to_temp_file(full_scad.as_str());
                if openscad_check(&args, &scad_file) {
                    // Add the record using a real URL with a dummy file name
                    if add_record(&args, name.as_str(), section.as_str(),
                        format!("{PARAPART_BASE}/local_scad/temp.scad").as_str(),
                        submitter, true, scad_file) {
                            return Ok(());
                        } else {
                            return Err("Failed to add record");
                        }
                } else {
                    return Err("INVALID OPENSCAD SCRIPT");
                }
            },
            _ => {}
        }
    }
    Err("Not a valid SCAD issue type")
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {

    let args = Args::parse();
    let token = fs::read_to_string(&args.token_file).unwrap();

    let octocrab = Octocrab::builder()
        .personal_token(token)
        .build()?;

    let issuebase = octocrab.issues("nbr0wn", "parapart");
    let issues = issuebase
    .list()
    .state(params::State::Open)
    .send()
    .await?;

    for issue in issues {
        if issue.title.trim() == "SCAD" {
            let title = issue.title.trim().to_string();
            let user = issue.user.login.trim().to_string();
            let id = issue.number.to_string().parse::<u64>().unwrap();
            println!("********************************************");
            println!("{}", format!("ISSUE ID: {id}\n ISSUE TITLE: {title}\nSUBMITTER: {user}"));
            match issue.body {
                Some(body) => {
                    if let Err(msg) = handle_issue(&args, &body, issue.user.login.as_str()).await {
                        // Add a comment.
                        issuebase.create_comment(id,&msg).await?;
                        println!("** PART ADD FAILED: {msg}")
                    } else {
                        // Add a comment.
                        issuebase.create_comment(id,&"Part Added").await?;
                        println!("** PART ADDED")
                    }
                    // Close the issue
                    issuebase.update(id)
                        .state(models::IssueState::Closed)
                        .send()
                        .await?;
                },
                None => {println!("ISSUE BODY IS NONE")},
            }
        }
    }

    Ok(())
}
