import dressDB from "../dress-db.yml";
import skillData from "./skill-data.yml";

const skillMap = new Map(skillData.map(s => [s.name, s]));

export function simulateSubDress({
  includedDresses,
  maxLvDresses,
  allDresses = getAllDresses(includedDresses, maxLvDresses),
  mainDressName,
  mainDress = allDresses.find(d => d.name === mainDressName),
  focusOn,
  orb,
  buff
}) {
  const mod = focusOn === "dps" ? simulateSkillMod(mainDress) : {[focusOn]: 1};
  
  const mainDressResult = buildDress({
    dress: mainDress,
    mod,
    orb,
    buff
  });
  
  const allSubs = [...getAllSubs(mainDress, allDresses, mod, orb, buff, true)]
    .sort(cmpScore)
    .reverse();
  
  return {
    mod,
    mainDress: mainDressResult,
    subDresses: allSubs
  };
}

function *getAllSubs(mainDress, allDresses, mod, orb, buff, useSubEl) {
  for (const dress of allDresses) {
    if (dress === mainDress) continue;
    
    const build = ignoreElement => {
      const r = buildDress({
        dress,
        mod,
        subRatio: getSubRatio(mainDress, dress, ignoreElement),
        orb,
        buff
      });
      r.ignoreElement = ignoreElement;
      return r;
    };
    
    if (dress.rarity === "R") {
      yield build(true);
      continue;
    }
    
    if (mainDress.element === dress.element) {
      yield build(false);
      continue;
    }
    
    if (useSubEl) {
      yield build(true);
    }
    yield build(false);
  }
}

function simulateSkillMod(dress, turn = 5) {
  const skill = skillMap.get(dress.name);
  if (!skill) throw new Error(`missing skill data for ${dress.name}`);

  const skills = skill.mods.map((mod, i) => ({
    mod,
    cd: dress.skill[i].cd?.[1] || 1,
    bonus: dress.skill[i].bonus,
    sleep: 0
  })).sort(cmpSkill);
  
  const finalMod = {};
  
  for (let i = 0; i < turn; i++) {
    const s = skills.filter(s => !s.sleep).pop();
    s.sleep = s.cd;
    addMod(finalMod, s.mod, s.bonus);
    
    for (const s of skills) {
      if (s.sleep) s.sleep--;
    }
  }
  
  return finalMod;
}

function addMod(a, b, bonus) {
  for (const key in b) {
    if (a[key]) {
      a[key] += b[key] * (100 + bonus) / 100;
    } else {
      a[key] = b[key] * (100 + bonus) / 100;
    }
  }
}

function cmpSkill(a, b) {
  if (Object.keys(b).every(k => a[k] > b[k])) return 1;
  if (Object.keys(b).every(k => a[k] < b[k])) return -1;
  
  // FIXME: is this the best way to choose skill?
  return a.cd - b.cd;
}

export function simulateDps({
  includedDresses,
  maxLvDresses,
  ignoreElement,
  orb,
  buff
}) {
  const allDresses = getAllDresses(includedDresses, maxLvDresses);
  
  const result = [];
  
  for (const dress of allDresses) {
    if (!skillMap.has(dress.name)) continue;
    
    const mod = simulateSkillMod(dress);
    const mainDress = buildDress({
      dress,
      mod,
      orb,
      buff
    });
    const subs = [...getAllSubs(dress, allDresses, mod, orb, buff, ignoreElement)]
      .sort(cmpScore)
      .reverse();
      
    const subDresses = [];
    const set = new Set;
    for (const sub of subs) {
      if (set.has(sub.dress.name)) continue;
      set.add(sub.dress.name);
      subDresses.push(sub);
      if (subDresses.length >= 4) break;
    }
   
    const subScore = subDresses.reduce((n, r) => n + r.score, 0);
    
    result.push({
      score: mainDress.score + subScore,
      mainDress,
      subDresses
    });
  }
  
  return result
    .sort(cmpScore)
    .reverse();
}

function getSubRatio(main, sub, ignoreElement = false) {
  return (20 +
    (getChar(main) === getChar(sub) ? 5 : 0) +
    (main.element === sub.element || ignoreElement ? 5 : 0)) / 100;
}

function getChar(dress) {
  return dress.name.split(" ").pop();
}

function buildOrb(dress, rarity, mod, buff) {
  return [...generateOrbs(dress, rarity)]
    .map(([name, p]) => ({
      score: calcScore(p, mod, buff),
      name
    }))
    .sort(cmpScore)
    .pop();
}

const FLAT_ORBS = {
  hp: [4240, 5220],
  atk: [270, 345],
  def: [270, 345],
  spd: [45, 60],
  fcs: [65, 80],
  rst: [65, 80]
};

function *generateOrbs(dress, rarity = "sr") {
  for (const stat of ["hp", "atk", "def"]) {
    yield [`${stat}%`, {
      [stat]: dress[stat] * (rarity === "ur" ? 0.65 : 0.5)
    }];
  }
  for (const [stat, value] of Object.entries(FLAT_ORBS)) {
    yield [stat, {[stat]: value[rarity === "ur" ? 1 : 0]}];
  }
}

function buildDress({
  dress,
  mod, 
  subRatio = 1,
  orb: orbRarity = "sr",
  buff = {}
}) {
  const orb = buildOrb(dress, orbRarity, mod, buff);
  return {
    score: (calcScore(dress, mod, buff) + orb.score) * subRatio,
    dress,
    orb
  };
}

function cmpScore(a, b) {
  return a.score - b.score;
}

function getAllDresses(included, maxLv) {
  included = new Set(included);
  maxLv = new Set(maxLv);
  
  return dressDB
    .filter(d => included.has(d.name))
    .map(shallowCopy)
    .map(dress => {
      for (const stat of ["hp", "atk", "def", "spd", "fcs", "rst"]) {
        if (Array.isArray(dress[stat])) {
          dress[stat] = dress[stat][maxLv.has(dress.name) ? 2 : 1];
        }
      }
      return dress;
    });
}

function shallowCopy(obj) {
  return {...obj};
}

function calcScore(dress, mod, buff) {
  let score = 0;
  for (const stat in mod) {
    score += (dress[stat] || 0) * mod[stat] * (buff[stat] || 1);
  }
  return score;
}
