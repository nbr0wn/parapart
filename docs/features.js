import { spawnOpenSCAD } from "./openscad-runner.js";

export async function detectFeatures() {
  // Output is {outputs: [name, content][], mergedOutputs: [{(stderr|stdout|error)?: string}], exitCode: number}
  const {mergedOutputs} = await spawnOpenSCAD({args: ['--help']});
  const stderr = mergedOutputs.filter(({stderr}) => stderr).map(({stderr}) => stderr).join("\n");
  
  const m = /.*?--enable\s+arg\s+enable? experimental features[^:]*:(.*?) -/m.exec(stderr.replaceAll('\n', ' '))
  if (m) {
    const features = m[1].split(/[\s|]+/g).filter(f => f != '');
    return features;
  }
  return [];
}

export async function buildFeatureCheckboxes(container, checkboxes, onchange) {
  const features = await detectFeatures();
  console.debug("Detected experimental features: ", features)

  for (const feature of features) {
    const div = Object.assign(document.createElement('div'), {
      className: 'text-fragment',
    });
    div.append(checkboxes[feature] = Object.assign(document.createElement('input'), {
      id:feature,
      checked: false,
      type: "checkbox",
      onchange
    }));
    const label = Object.assign(document.createElement('label'), {
      htmlFor:feature,
      innerHTML:feature
    });
    div.appendChild(label);
    
    container.append(div);
  }
}
