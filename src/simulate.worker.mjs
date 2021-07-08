import dressDB from "../dress-db.yml";

import {calcScore, cmpScore, charGroup} from "./simulate-util.mjs";
import {buildOrb} from "./simulate-orb.mjs";
import {simulateSkillMod, skillMap} from "./simulate-skill.mjs";

export function simulateSubDress({
  includedDresses,
  maxLvDresses,
  allDresses = getAllDresses(includedDresses, maxLvDresses),
  mainDressName,
  mainDress = allDresses.find(d => d.name === mainDressName),
  orbRarity,
  mod,
  useSubGroup
}) {
  const mainDressResult = buildDress({
    dress: mainDress,
    mod,
    orbRarity
  });
  
  const allSubs = [...getAllSubs({
    mainDress,
    allDresses,
    mod,
    orbRarity,
    useSubEl: true,
    useSubGroup
  })]
    .sort(cmpScore)
    .reverse();
  
  return {
    mod,
    mainDress: mainDressResult,
    subDresses: allSubs
  };
}

function *getAllSubs({
  mainDress,
  allDresses,
  mod,
  orbRarity,
  useSubEl,
  useSubGroup,
  leaderBuff, 
}) {
  for (const dress of allDresses) {
    if (dress === mainDress) continue;
    
    const build = subElement =>
      buildDress({
        dress,
        mod,
        subRatio: getSubRatio(mainDress, dress, subElement, useSubGroup),
        subElement,
        orbRarity,
        leaderBuff
      });
    
    yield build(false);
    
    if (useSubEl && !isJoker(dress) && mainDress.element !== dress.element) {
      yield build(true);
    }
  }
}

function normalizeBuff(arr = []) {
  const result = {
    length: arr.length
  };
  for (const key of arr) {
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

function getDefaultTargetBuff() {
  return {
    immune: {
      stun: true // this makes wine iroha stronger
    }
  };
}

export function simulateDps({
  includedDresses,
  maxLvDresses,
  ignoreElement,
  orb,
  buff,
  debuff,
  target = {},
  targetDebuff,
  turn,
  useCut,
  targetNumber,
  endlessMode,
  recastReduction,
  leaderBuff,
  hpPct,
  targetHpPct,
  useSubGroup,
  extraDamageElement
}) {
  target = normalizeTarget(target);
  buff = normalizeBuff(buff);
  debuff = normalizeBuff(debuff);
  targetDebuff = normalizeBuff(targetDebuff);
  
  const allDresses = getAllDresses(includedDresses, maxLvDresses);
  
  const result = [];
  
  for (const dress of allDresses) {
    if (!skillMap.has(dress.name)) continue;
    
    const useLeaderBuff = leaderBuff && leaderBuff.element === dress.element ? leaderBuff : undefined;
    
    for (const {history, mod} of simulateSkillMod({
      turn,
      dress, 
      targetDef: target.targetDef,
      targetElement: target.targetElement,
      buff,
      debuff,
      targetBuff: getDefaultTargetBuff(), // FIXME: make it customizable
      targetDebuff,
      useCut,
      targetNumber,
      endlessMode,
      recastReduction,
      hpPct,
      targetHpPct,
      extraDamageElement
    })) {
      const mainDress = buildDress({
        dress,
        mod,
        orbRarity: orb,
        leaderBuff: useLeaderBuff
      });
      const subs = [...getAllSubs({
        mainDress: dress,
        allDresses,
        mod,
        orb,
        useSubEl: ignoreElement,
        useSubGroup,
        leaderBuff: useLeaderBuff && leaderBuff.type.endsWith("%") ? leaderBuff : undefined
      })]
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
      
      const targetScore = calcScore(target, mod);
      
      result.push({
        score: mainDress.score + subScore + targetScore,
        mainDress,
        subDresses,
        mod,
        history
      });
    }
  }
  
  const set = new Set;
  
  return result
    .sort(cmpScore)
    .reverse()
    .filter(r => {
      if (set.has(r.mainDress.dress.name)) {
        return false;
      }
      set.add(r.mainDress.dress.name);
      return true;
    });
}

function normalizeTarget(target) {
  const result = {};
  for (const key in target) {
    result[`target${key[0].toUpperCase()}${key.slice(1)}`] = target[key];
  }
  return result;
}

function getSubRatio(main, sub, subElement, useSubGroup) {
  return (20 +
    (isSameChar() ? 5 : 0) +
    (main.element === sub.element || isJoker(sub) || subElement ? 5 : 0)) / 100;
    
  function isSameChar() {
    const charA = getChar(main);
    const charB = getChar(sub);
    return charA === charB || useSubGroup && charGroup[charA] === charGroup[charB];
  }
}

function isJoker(dress) {
  return dress.rarity === "R" || /^Magica2020 \S+$/.test(dress.name);
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
  leaderBuff
}) {
  const orb = buildOrb({
    dress,
    rarity: orbRarity,
    mod,
    subElement,
    leaderBuff: leaderBuff && leaderBuff.type.endsWith("%") ? leaderBuff : undefined
  });
  return {
    score: (calcScore(dress, mod, leaderBuff) + orb.score) * subRatio,
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
