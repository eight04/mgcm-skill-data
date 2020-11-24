
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
  const skillInfo = nameIndex.get(skill.name).skill;
  
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
    // FIXME: use a correct ratio instead of 0.3
    const ratio = dress.name.split(" ").pop() === skill.name.split(" ").pop() ? 0.3 : 0.2;
    allSubDresses.push(buildDress(dress, skill.finalMod, ratio));
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
const header = [
  "score", "mainDress", "mainPearl",
  ...[1, 2, 3, 4, 5].map(n => [`subDress${n}`, `subPearl${n}`]).flat()
];
console.log(header.join(","));
for (const r of result) {
  const row = [
    r.score,
    r.mainDress.dress.name,
    r.mainDress.pearl,
    ...r.subDresses.map(d => [d.dress.name, d.pearl]).flat()
  ];
  console.log(row.join(","));
}

function buildDress(dress, mod, subRatio = 1) {
  const pearl = [...generatePearls(dress)]
    .map(([name, p]) => ({
      score: calcScore(p, mod),
      name
    }))
    .sort((a, b) => a.score - b.score)
    .pop();
    
  return {
    score: (calcScore(dress, mod) + pearl.score) * subRatio,
    dress,
    pearl: pearl.name
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
    yield [`${stat}%`, {
      [stat]: dress[stat] * 0.5
    }];
  }
  const con = {
    hp: 4240,
    atk: 270,
    def: 270,
    spd: 45,
    fcs: 65,
    rst: 65
  };
  for (const [stat, value] of Object.entries(con)) {
    yield [stat, {[stat]: value}];
  }
}

function calcScore(dress, mod) {
  let score = 0;
  for (const stat in mod) {
    score += (dress[stat] || 0) * mod[stat];
  }
  return score;
}
