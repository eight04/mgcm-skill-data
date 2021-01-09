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
await sheet.loadCells("O2:Z");
await sheet.loadCells("AG2:AL");

for (let i = 1; i < sheet.rowCount; i++) {
  const name = sheet.getCell(i, aToIndex("Q"));
  
  if (!name.value) continue;
  
  console.log(name.value, sheet.getCell(i, aToIndex("O")).value);
  
  const charName = NAME_JP2EN[name.value.split(" ").pop()];
  const list = chars.get(charName);
  
  if (!list && sheet.getCell(i, aToIndex("O")).value === false) {
    continue;
  }
  
  if (list.get(name.value)) continue;
  
  const skill = [];
  let invalid = false;
  for (let j = 0; j < 3; j++) {
    const hits = sheet.getCell(i, aToIndex("R") + j * 3);
    if (!hits.value) {
      skill.push(0);
      continue;
    }
    
    const mod = sheet.getCell(i, aToIndex("S") + j * 3);
    const stat = sheet.getCell(i, aToIndex("AG") + j * 2);
    const statName = getStatName(stat.value);
    const statMod = sheet.getCell(i, aToIndex("AH") + j * 2);
    
    let result = mod.value;
    if (statName) {
      if (!statMod.value) {
        invalid = true;
        break;
      }
      result += ` +${statName}*${statMod.value}`;
    }
    if (hits.value > 1) {
      result += ` *${hits.value}`;
    }
    skill.push(result);
  }
  
  if (
    invalid ||
    skill.every(s => s === 0) ||
    skill.some(s => s === null)
  ) continue;
  
  list.set(name.value, skill);
}

for (const [name, list] of chars.entries()) {
  await writeFile(`data/${name}.yml`, YAML.stringify(Object.fromEntries(list)));
}

function getStatName(stat) {
  if (!stat) return null;
  const match = stat.toLowerCase().match(/^(self|target)\s+(\w+)$/i);
  if (!match) return null;
  if (match[1] === "self") {
    return match[2];
  }
  return "target" + match[2][0].toUpperCase() + match[2].slice(1);
}

function aToIndex(s) {
  s = s.toLowerCase();
  let index = 0;
  for (let i = 0; i < s.length; i++) {
    index = index * 26 + s.charCodeAt(i) - 96;
  }
  return index - 1;
}