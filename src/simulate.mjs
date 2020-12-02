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

function getSubRatio(main, sub, subElement) {
  return (20 +
    (getChar(main) === getChar(sub) ? 5 : 0) +
    (main.element === sub.element || subElement ? 5 : 0)) / 100;
}

function getChar(dress) {
  return dress.name.split(" ").pop();
}

function buildOrb({dress, rarity, mod, buff, subElement}) {
  const suggestedEffects = Object.keys(mod).filter(t => !t.startsWith("target"));
  return [...generateOrbs(dress, rarity, suggestedEffects, subElement)]
    .map(orb => {
      if (subElement) {
        orb.subEffects.push("elm");
      }
      return {
        score: calcScore(orb.stats, mod, buff),
        name: `${orb.mainEffect} (${orb.subEffects.join(",")})`
      };
    })
    .sort(cmpScore)
    .pop();
}

function *combination(list, len) {
  if (list.length <= len) {
    yield list.slice();
    return;
  }
  
  const result = [];
  yield* search(0);
  
  function *search(index) {
    if (result.length >= len) {
      yield result.slice();
      return;
    }
    for (let i = index; list.length - i >= len - result.length; i++) {
      result.push(list[i]);
      yield* search(i + 1);
      result.pop();
    }
  }  
}

const MAIN_EFFECTS = {
  hp: [4240, 5220],
  "hp%": [0.5, 0.65],
  atk: [270, 345],
  "atk%": [0.5, 0.65],
  def: [270, 345],
  "def%": [0.5, 0.65],
  spd: [45, 60],
  fcs: [65, 80],
  rst: [65, 80]
};

const SUB_EFFECTS = {
  "hp": [2050, 2610],
  "hp%": [0.22, 0.30],
  "atk": [135, 170],
  "atk%": [0.22, 0.30],
  "def": [135, 170],
  "def%": [0.22, 0.30],
  "spd": [18, 25],
  "fcs": [27, 35],
  "rst": [27, 35]
};

const SUB_EFFECT_ALL = [0.05, 0.07];

function *generateOrbs(dress, rarity = "sr", suggestedEffects = [], subElement = false) {
  suggestedEffects = [...normalizeSuggestedEffects(suggestedEffects)];
  
  for (const stat of suggestedEffects) {
    for (const subs of combination([
      ...suggestedEffects.filter(e => e != stat),
      "all"
    ], subElement ? 3 : 4)) {
      yield {
        mainEffect: stat,
        subEffects: subs,
        subElement,
        stats: buildOrbStats(dress, stat, subs, rarity)
      };
    }
  }
}

function buildOrbStats(dress, main, subs, rarity) {
  const rarityIndex = rarity === "ur" ? 1 : 0;
  const result = {};
  assignStat(main, MAIN_EFFECTS);
  subs.forEach(s => assignStat(s, SUB_EFFECTS));
  return result;
  
  function assignStat(name, effectTable) {
    if (name === "all") {
      for (const key of ["hp", "atk", "def", "spd", "fcs", "rst"]) {
        result[key] = (result[key] || 0) + dress[key] * SUB_EFFECT_ALL[rarityIndex];
      }
    } else if (name.endsWith("%")) {
      const key = name.slice(0, -1);
      result[key] = (result[key] || 0) + dress[key] * effectTable[name][rarityIndex];
    } else {
      result[name] = (result[name] || 0) + effectTable[name][rarityIndex];
    }
  }
}

function *normalizeSuggestedEffects(effects) {
  for (const e of effects) {
    yield e;
    if (MAIN_EFFECTS[e + "%"]) {
      yield e + "%";
    }
  }
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
