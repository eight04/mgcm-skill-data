import {readFile} from "fs/promises";
import YAML from "yaml";

import {NAMES} from "./chars.mjs";

export async function getAllDresses() {
  return YAML.parse(await readFile("dress-db.yml", "utf8"));
}

export async function getAllSkills() {
  const allSkills = [];
  for (const name of NAMES) {
    const map = YAML.parse(await readFile(`data/${name}.yml`, "utf8"));
    for (const [dressName, skills] of Object.entries(map)) {
      if (
        !Array.isArray(skills) ||
        skills.some(s => typeof s !== "string" && typeof s !== "number")
      ) {
        continue;
      }
      allSkills.push({
        name: dressName,
        mods: skills.map(parseSkill)
      });
    }
  }
  // console.log(skills.length);
  return allSkills;
}

function parseSkill(text) {
  if (typeof text === "number") {
    return {
      atk: text
    };
  }
  const match = text.match(/^([\d.]+)(?:\s+\+(\w+)\*([\d.]+))?(?:\s+\*\s*(\d+))?$/);
  const hits = match[4] ? Number(match[4]) : 1;
  const mod = {
    atk: Number(match[1]) * hits
  };
  if (match[2]) {
    mod[match[2]] = Number(match[3]) * hits;
  }
  return mod;
}
