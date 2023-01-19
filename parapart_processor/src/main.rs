use chrono::prelude::*;
use clap::Parser;
use octocrab::{Octocrab,params,models};
use regex::Regex;
use reqwest;
use rusqlite::{Connection, Result, named_params};
use std::fs;
use std::io;
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

   /// Leave issues open after processing
   #[arg(short='l', long, default_value_t =false)]
   leave_open: bool,
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
        .arg("--imgsize=512,512")
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

    println!("OpenSCAD OUTPUT CREATED: {}", output.status.success());

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

    println!("Imagemagick convert status: {}", convert_output.status.success());

        io::stdout().write_all(&convert_output.stdout).unwrap();
        io::stderr().write_all(&convert_output.stderr).unwrap();

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
    // Do this in a transaction so we don't have hanging records
    let tx = conn.transaction()?;
    tx.execute("INSERT INTO part (name, url, submitter) VALUES (?1, ?2, ?3)",
        (&name, &url, &submitter))?;
    tx.execute("INSERT INTO part_section (part_id, section_id) VALUES (?1, ?2)",
        (&seq, &section))?;
    tx.commit()
}

fn check_if_insert(db_path: &str, name: &str, section: &str, url: &str, submitter: &str) -> Result<bool,String> {
    let conn = Connection::open(format!("{db_path}")).unwrap();
    // Check to see if URL exists anywhere in the db.  Fetch the section name for the error message
    let mut stmt = conn.prepare("
        SELECT 
        part.name, part.submitter, part_section.section_id, section.name 
        FROM 
        part
        INNER JOIN part_section ON part.id = part_section.part_id
        INNER JOIN section ON section.id = part_section.section_id
        WHERE
        part.url = :url").unwrap();
    let mut rows = stmt.query(named_params!{":url": url.to_string()}).unwrap();
    if let Some(row) = rows.next().unwrap() {
        // URL exists.  Is this an update
        // Only allow it if the name, section, and submitter match
        let dbname:String = row.get(0).unwrap();
        let dbsubmitter:String = row.get(1).unwrap();
        let dbsection:String = row.get(2).unwrap();
        let dbsection_name:String = row.get(3).unwrap();

        if name == dbname && section == dbsection
            && ( submitter == dbsubmitter || submitter == "nbr0wn" ) {
            // This is an update, not an insert
            return Ok(false);
        }
        else {
            return Err(format!("OpenSCAD script URL already exists in database as '{}' in section '{}'",
                dbname, dbsection_name));
        }
    }
    // New URL - Check to see if part name exists in section
    let mut stmt2 = conn.prepare("
        SELECT 
        part.name
        FROM 
        part
        INNER JOIN part_section ON part.id = part_section.part_id
        WHERE
        part.name = :part_name
        AND
        part_section.section_id =:section_id").unwrap();
    let mut rows2 = stmt2.query(named_params! {":part_name": name, ":section_id": section}).unwrap();
    if let Some(_row) = rows2.next().unwrap() {
        // It exists.  Denied!
        return Err(format!("Part with this name already exists in section"));
    }

    // All good - insert new record
    Ok(true)
}

fn add_record(args: &Args, name: &str, section: &str, url: &str, submitter: &str, 
    local_scad: bool, temp_file: NamedTempFile ) -> Result<(), String> {
    let db_path = format!("{}/database/parapart.sqlite3", args.parapart);
    let seq = get_next_seq(db_path.as_str());
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

    // Check to see if we need to insert a new record or just update the generated files
    match check_if_insert(db_path.as_str(),name,section,url,submitter) {
        Ok(insert) => if insert {
            // Insert the part record
            match insert_part(db_path.as_str(), seq, name, section, insert_url.as_str(), submitter) {
                Ok(_) => {},
                Err(e) => return Err(format!("Failed to insert part: {:?}", e))
            }
        },
        Err(e) => return Err(format!("Existing Record Check failed; {}", e))
    };  

    Ok(())
}

async fn handle_issue(args: &Args, body: &String, submitter: &str) -> Result<(),String> {
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
                    return Err("Not a valid SCAD issue type".to_string());
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
                        return add_record(&args, name.as_str(), section.as_str(), 
                            url.as_str(), submitter, false,scad_file);
                    }
                    else {
                        return Err("INVALID OPENSCAD FILE".to_string());
                    }
                } else {
                    return Err("INVALID OPENSCAD URL".to_string());
                }
            },
            "SCAD" => { 
                if name.is_empty() || section.is_empty()  {
                    return Err("Not a valid SCAD issue type".to_string());
                }
                // Just in case someone forgot to delete the auto generated message
                let re1 = Regex::new(r"\[PASTE YOUR OPENSCAD SCRIPT HERE\]").unwrap();
                let temp = re1.replace(body,"");

                let re = Regex::new(r".*(?sm)```\s+(.*)\s+```.*").unwrap();
                let caps = re.captures(&temp).unwrap();
                let scad = caps.get(1).map_or("", |m| m.as_str().trim());


                let date = Utc::now().format("%Y-%m-%d").to_string();
                let full_scad = format!("// ADDED BY:{submitter}\r\n// ADD DATE:{date}\r\n{scad}");
                // Extract the scad script
                println!("SCAD SCRIPT: {:?}", full_scad);
                // Write the scad script to the temp file
                let scad_file:NamedTempFile = write_to_temp_file(full_scad.as_str());
                if openscad_check(&args, &scad_file) {
                    // Add the record using a real URL with a dummy file name
                    return add_record(&args, name.as_str(), section.as_str(),
                        format!("{PARAPART_BASE}/local_scad/temp.scad").as_str(),
                        submitter, true, scad_file);
                } else {
                    return Err("INVALID OPENSCAD SCRIPT".to_string());
                }
            },
            _ => {}
        }
    }
    Err("Not a valid SCAD issue type".to_string())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {

    let args = Args::parse();
    let token = fs::read_to_string(&args.token_file).unwrap().trim().to_string();
    

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
        match  issue.title.trim() {
            "SCAD" => {
                let id = issue.number.to_string().parse::<u64>().unwrap();
                let user = issue.user.login.trim().to_string();
                println!("********************************************");
                println!("{}", format!("ISSUE ID: {id} - NEW SCAD submitted by {user}"));
                match issue.body {
                    Some(body) => {
                        if let Err(msg) = handle_issue(&args, &body, issue.user.login.as_str()).await {
                            // Add a github issue comment
                            issuebase.create_comment(id,&msg).await?;
                            println!("** PART ADD FAILED: {msg}")
                        } else {
                            // Add a github issue comment
                            issuebase.create_comment(id,&"Part Added").await?;
                            println!("** PART ADDED")
                        }
                        if args.leave_open == false {
                            // Close the issue
                            issuebase.update(id)
                                .state(models::IssueState::Closed)
                                .send()
                                .await?;
                        }
                    },
                    None => {println!("ISSUE BODY IS NONE")},
                }
            },
            _ => {}
        }
    }

    Ok(())
}
