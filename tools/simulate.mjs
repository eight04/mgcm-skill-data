
import {getAllDresses, getAllSkills} from "./lib/util.mjs";

const allDresses = await getAllDresses();

// use lv.80 for common dress and lv.60 for rare dress
for (const dress of allDresses) {
  const isCommon = ["R", "N"].includes(dress.rarity)
    || dress.pool === "event"
    || dress.pool === "story";
  for (const stat of ["hp", "atk", "def", "spd", "fcs", "rst"]) {
    if (Array.isArray(dress[stat])) {
      dress[stat] = dress[stat][isCommon ? 2 : 1];
    }
  }
}

const nameIndex = new Map(allDresses.map(d => [d.name, d]));

const allSkills = await getAllSkills();

// calculate final mod for 5 turns?
for (const skill of allSkills) {
  const skillInfo = nameIndex.get(skill.name).skills;
  
  const skills = skill.mods.map((mod, i) => ({
    mod,
    cd: skillInfo[i].cd?.[1] || 1,
    bonus: skillInfo[i].bonus,
    sleep: 0
  })).sort(compareSkill);
  
  const finalMod = {};
  
  for (let i = 0; i < 5; i++) {
    const s = skills.filter(s => !s.sleep).pop();
    s.sleep = s.cd;
    addMod(finalMod, s.mod);
    
    for (const s of skills) {
      if (s.sleep) s.sleep--;
    }
  }
  
  skill.finalMod = finalMod;
}

// build dresses and get the final score
const result = [];
for (const skill of allSkills) {
  const allSubDresses = [];
  
  for (const dress of allDresses) {
    if (dress.name === skill.name) continue;
    subDresses.push(buildDress(dress, skill.finalMod));
  }
  
  allSubDresses.sort((a, b) => a.score - b.score);
  
  const subDresses = allSubDresses.slice(-5);
  const mainDress = buildDress(nameIndex.get(skill.name), skill.finalMod);
  result.push({
    score: mainDress.score + subDresses.reduce((n, d) => n + d.score, 0),
    mainDress,
    subDresses
  });
}
result.sort((a, b) => a.score - b.score);
for (const r of result) {
  console.log(`${r.mainDress.name}\t${r.score}`);
}

function buildDress(dress, mod) {
  const pearl = [...generatePearls(dress)]
    .map(p => ({
      score: calcScore(p, mod),
      pearl: p
    }))
    .sort((a, b) => a.score - b.score)
    .pop();
    
  return {
    score: calcScore(dress, mod) + pearl.score,
    dress,
    pearl: pearl.pearl
  };
}

function addMod(a, b) {
  for (const key in b) {
    if (a[key]) {
      a[key] += b[key];
    } else {
      a[key] = b[key];
    }
  }
}

function compareSkill(a, b) {
  if (Object.keys(b).every(k => a[k] > b[k])) return 1;
  if (Object.keys(b).every(k => a[k] < b[k])) return -1;
  
  // FIXME: is this the best way to choose skill?
  return a.cd - b.cd;
}

function *generatePearls(dress) {
  // SR pearls
  for (const stat of ["hp", "atk", "def"]) {
    yield {
      [stat]: dress[stat] * 0.5
    };
  }
  yield {hp: 4240};
  yield {atk: 270};
  yield {def: 270};
  yield {spd: 45};
  yield {fcs: 65};
  yield {rst: 65};
}

function calcScore(dress, mod) {
  let score = 0;
  for (const stat in mod) {
    score += dress[stat] * mod[stat];
  }
  return score;
}
