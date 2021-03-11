import {readFile} from "fs/promises";
import YAML from "yaml";

import {NAMES} from "./chars.mjs";

export async function getAllDresses() {
  return YAML.parse(await readFile("dress-db.yml", "utf8"));
}

export async function getAllSkills() {
  const allSkills = new Map;
  for (const name of NAMES) {
    const map = YAML.parse(await readFile(`data/${name}.yml`, "utf8"));
    for (const [dressName, skills] of Object.entries(map)) {
      if (
        !Array.isArray(skills) ||
        skills.some(s => typeof s !== "string" && typeof s !== "number")
      ) {
        continue;
      }
      allSkills.set(dressName, {
        name: dressName,
        skills: [...skills.map(parseSkill)]
      });
    }
    
    let specialMap;
    try {
      specialMap = YAML.parse(await readFile(`data/${name}-special.yml`, "utf8"));
    } catch (err) {
      if (err.code === "ENOENT") {
        continue;
      }
      throw err;
    }
    for (const [dressName, data] of Object.entries(specialMap)) {
      if (!data) continue;
      let passive, active;
      if (Array.isArray(data)) {
        active = data;
      } else {
        ({active, passive} = data);
      }
      const skill = allSkills.get(dressName);
      if (!skill) continue;
      
      if (active) {
        skill.special = active;
      }
      if (passive) {
        skill.passive = passive;
      }
    }
  }
  return [...allSkills.values()];
}

function parseLine(line) {
  const rx = /[\d-.]+|[a-zA-Z]+|\S/g;
  let match;
  const result = {
    hits: 1,
    aoe: false,
    mod: {}
  };
  while ((match = rx.exec(line))) {
    if (!isNaN(Number(match[0]))) {
      result.mod.atk = Number(match[0]);
    } else if (match[0] === "+") {
      const [prop] = rx.exec(line);
      rx.exec(line);
      const [value] = rx.exec(line);
      result.mod[prop] = Number(value);
    } else if (match[0] === "*") {
      const [hits] = rx.exec(line);
      result.hits = Number(hits);
    } else if (match[0] === "aoe") {
      result.aoe = true;
    } else {
      throw new Error(`failed to parse ${line}`);
    }
  }
  return result;
}

function* parseSkill(text) {
  text = String(text);
  
  for (const line of text.split("\n")) {
    yield parseLine(line);
  }
}
