import {calcScore, cmpScore} from "./simulate-util.mjs";

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

export function buildOrb({dress, rarity, mod, subElement, leaderBuff}) {
  const suggestedEffects = Object.keys(mod).filter(t => !t.startsWith("target"));
  return [...generateOrbs(dress, rarity, suggestedEffects, subElement)]
    .map(orb => {
      if (subElement) {
        orb.subEffects.push("elm");
      }
      return {
        score: calcScore(orb.stats, mod, leaderBuff),
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
