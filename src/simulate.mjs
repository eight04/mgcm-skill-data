import dressDB from "../dress-db.yml";
import skillData from "./skill-data.yml";

import {calcScore, cmpScore} from "./simulate-util.mjs";
import {buildOrb} from "./simulate-orb.mjs";

const skillMap = new Map(skillData.map(s => [s.name, s]));

export function simulateSubDress({
  includedDresses,
  maxLvDresses,
  allDresses = getAllDresses(includedDresses, maxLvDresses),
  mainDressName,
  mainDress = allDresses.find(d => d.name === mainDressName),
  focusOn,
  orbRarity,
  buff
}) {
  const mod = focusOn === "dps" ? simulateSkillMod(mainDress) : {[focusOn]: 1};
  
  const mainDressResult = buildDress({
    dress: mainDress,
    mod,
    orbRarity,
    buff
  });
  
  const allSubs = [...getAllSubs(mainDress, allDresses, mod, orbRarity, buff, true)]
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
    
    const build = subElement =>
      buildDress({
        dress,
        mod,
        subRatio: getSubRatio(mainDress, dress, subElement),
        subElement,
        orbRarity: orb,
        buff
      });
    
    yield build(false);
    
    if (useSubEl && dress.rarity !== "R" && mainDress.element !== dress.element) {
      yield build(true);
    }
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
  
  for (const key in finalMod) {
    finalMod[key] = finalMod[key] / turn;
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
  buff,
  target = {}
}) {
  target = normalizeTarget(target);
  
  const allDresses = getAllDresses(includedDresses, maxLvDresses);
  
  const result = [];
  
  for (const dress of allDresses) {
    if (!skillMap.has(dress.name)) continue;
    
    const mod = simulateSkillMod(dress);
    const mainDress = buildDress({
      dress,
      mod,
      orbRarity: orb,
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
    
    const targetScore = calcScore(target, mod, buff);
    
    result.push({
      score: mainDress.score + subScore + targetScore,
      mainDress,
      subDresses
    });
  }
  
  return result
    .sort(cmpScore)
    .reverse();
}

function normalizeTarget(target) {
  const result = {};
  for (const key in target) {
    result[`target${key[0].toUpperCase()}${key.slice(1)}`] = target[key];
  }
  return result;
}

function getSubRatio(main, sub, subElement) {
  return (20 +
    (getChar(main) === getChar(sub) ? 5 : 0) +
    (main.element === sub.element || sub.rarity === "R" || subElement ? 5 : 0)) / 100;
}

function getChar(dress) {
  return dress.name.split(" ").pop();
}

function buildDress({
  dress,
  mod, 
  subRatio = 1,
  subElement = false,
  orbRarity = "sr",
  buff = {}
}) {
  const orb = buildOrb({
    dress,
    rarity: orbRarity,
    mod,
    buff,
    subElement
  });
  return {
    score: (calcScore(dress, mod, buff) + orb.score) * subRatio,
    dress,
    orb
  };
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
