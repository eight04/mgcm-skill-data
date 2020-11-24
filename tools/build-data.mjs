import {readFile, writeFile} from "fs/promises";
import YAML from "yaml";
import gs from "google-spreadsheet";

import {NAME_JP2EN} from "./lib/chars.mjs";

const allDresses = YAML.parse(await readFile("dress-db.yml", "utf8"));
const chars = new Map;

for (const dress of allDresses) {
  const name = NAME_JP2EN[dress.name.split(" ").pop()];
  const list = chars.get(name) || chars.set(name, new Map).get(name);
  list.set(dress.name, null);
}

for (const [name, list] of chars) {
  const localData = YAML.parse(await readFile(`data/${name}.yml`, "utf8"));
  for (const [dressName, value] of Object.entries(localData)) {
    list.set(dressName, value);
  }
}

const doc = new gs.GoogleSpreadsheet("1N80A2Uz0lQe8COz3e_xWOePh0_RIMq0hYxkgsMv0CWI");
doc.useApiKey("AIzaSyBmF9PBdznx-Dpxa2YOWWK6gcThwPFpLDM");
await doc.loadInfo();
const sheet = doc.sheetsByIndex[0];
await sheet.loadCells("Q2:Z");
await sheet.loadCells("AJ2:AL");
const y = 1;
const x = 16;

for (let i = y; i < sheet.rowCount; i++) {
  const name = sheet.getCell(i, x);
  
  if (!name.value) continue;
  
  const charName = NAME_JP2EN[name.value.split(" ").pop()];
  const list = chars.get(charName);
  
  if (list.get(name.value)) continue;
  
  // check if there are invalid data in [AJ,AL]
  let invalid = false;
  for (let j = 0; j < 3; j++) {
    const cell = sheet.getCell(i, 26 + 9 + j);
    if (cell.value && cell.effectiveFormat.textFormat.underline) {
      invalid = true;
      break;
    }
  }
  if (invalid) continue;
  
  const skill = [];
  for (let j = 0; j < 3; j++) {
    const hits = sheet.getCell(i, x + 1 + j * 3);
    if (!hits.value) {
      skill.push(0);
      continue;
    }
    const mod = sheet.getCell(i, x + 1 + j * 3 + 1);
    // if (mod.effectiveFormat.textFormat.underline) {
      // invalid = true;
      // break;
    // }
    skill.push(
      hits.value > 1 ?
        `${mod.value} *${hits.value}` :
      mod.value
    );
  }
  
  if (
    // invalid ||
    skill.every(s => s === 0) ||
    skill.some(s => s === null)
  ) continue;
  
  list.set(name.value, skill);
}

for (const [name, list] of chars.entries()) {
  await writeFile(`data/${name}.yml`, YAML.stringify(Object.fromEntries(list)));
}
