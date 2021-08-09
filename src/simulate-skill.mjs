import allSkillData from "./skill-data.yml";
import {getBuffValue} from "./simulate-util.mjs";

const SPECIALS = {
  "聖チャールズスポーツユニ りり": [
    null,
    {
      cutRate: cutByCrit(3)
    }
  ],
  "Magica2061 はなび": [
    null,
    null,
    {
      condBonus: bonusByTargetDebuff(0.15)
    }
  ],
  "ギャルアーミー 丹": [
    null,
    {
      condBonus: ({targetDebuff}) => targetDebuff.length ? 1.5 : 1
    }
  ],
  "灼熱野球ユニ 蒼": [
    null,
    null,
    {
      cutRate: cutByCrit(4 * 2)
    }
  ],
  "灼熱野球ユニ ここあ": [
    null,
    null,
    {
      missRate: ({targetDebuff}) => targetDebuff.def ? -999 : 0,
      critRate: ({targetDebuff}) => targetDebuff.def ? 999 : 0
    }
  ],
  "ワイン娘 いろは": [
    null,
    null,
    {
      condBonus: ({targetBuff}) => targetBuff.immune.stun ? 1.5 : 1
    }
  ],
  "サディスティックサキュバス マリアンヌ": [
    null,
    null,
    {
      condBonus: ({targetDebuff}) => targetDebuff.sleep ? 1.5 : 1
    }
  ],
  "サディスティックサキュバス りり": [
    null,
    {
      condBonus: ({targetDebuff}) => targetDebuff.sleep ? 1.5 : 1
    }
  ],
  "デモンズスタイルレウコシア 陽彩": [
    null,
    null,
    {
      condBonus: bonusByTargetDebuff(0.3)
    }
  ],
  "マジカルスイムスーツ ここあ": [
    null,
    null,
    {
      condBonus: bonusByTargetDebuff(0.15)
    }
  ],
  "†ハロウィッチ† いろは": {
    condBonus: bonusByBuffNumber(0.2)
  },
  "フェニックス はなび": {
    condBonus: bonusByTargetDebuff(0.2)
  },
  "デモンズスタイルレウコシア ここあ": {
    condBonus: bonusByBuffNumber(0.1)
  },
  "デモンズスタイルレウコシア 丹": {
    critRate: ({targetDebuff}) => targetDebuff.length ? 0 : 1
  },
  "Ultimate Magica 陽彩": [
    null,
    null,
    {
      critRate: ({targetElement}) => targetElement === "light" ? 0.35 : 0.15,
      extraDamageOnCrit: ({targetElement}) => targetElement === "light" ? 2.5 : 2
    }
  ],
  "バハムート 陽彩": [
    null,
    {
      condBonus: bonusByTargetDebuff(0.05/0.4)
    }
  ],
  "デモンズスタイルドレイク エリザ": [
    null,
    null,
    {
      condBonus: ({targetBuff}) => targetBuff.immune.stun ? 1.5 : 1
    }
  ],
  "イフリート 依子": [
    null,
    null,
    {
      cutRate: ({targetBuff}) => targetBuff.length * 2
    }
  ],
  [
    null,
    null,
    {
      condBonus: bonusByTargetDebuff(0.3)
    }
  ]
};

export const skillMap = new Map(allSkillData.map(s => [s.name, compileSkill(s)]));

// FIXME: should we move this to build-time?
function compileSkill({name, skills, special, passive}) {
  const result = [];
  for (let i = 0; i < skills.length; i++) {
    result.push({
      skill: skills[i],
      special: compileSpecial(special?.[i], passive, Array.isArray(SPECIALS[name]) ? SPECIALS[name][i] : SPECIALS[name])
    });
  }
  return result;
}

function compileSpecial(...args) {
  const result = {};
  for (const target of args) {
    if (!target) continue;
    
    for (const key in target) {
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(target[key]);
    }
  }
  return result;
}

function bonusByBuffNumber(bonus) {
  return ({buff}) => Object.keys(buff).length * bonus + 1;
}

function bonusByTargetDebuff(bonus) {
  return ({targetDebuff}) => targetDebuff.length * bonus + 1;
}

function cutByCrit(scale) {
  return ({r}) => (1 - r.missRate) * r.critRate * scale;
}

const SUPER = {
  fire: "lightning",
  lightning: "water",
  water: "fire",
  dark: "light",
  light: "dark"
};

function getElementAffinity(self, target) {
  if (SUPER[self] === target) {
    return "superior";
  }
  if (SUPER[target] === self) {
    return "inferior";
  }
  return "neutral";
}

const BASE_RATE = {
  superior: {
    missRate: 0,
    critRate: 0.45,
    heavyRate: 0.3,
    ignoreDefRate: 0
  },
  inferior: {
    missRate: 0.5,
    critRate: 0.15,
    heavyRate: 0,
    ignoreDefRate: 0
  },
  neutral: {
    missRate: 0,
    critRate: 0.3,
    heavyRate: 0,
    ignoreDefRate: 0
  }
};

function sum(arr, context) {
  if (!arr) return 0;
  let result = 0;
  for (const value of arr) {
    if (typeof value === "function") {
      result += value(context);
    } else {
      result += value;
    }
  }
  return result;
}

function product(arr, context) {
  if (!arr) return 1;
  let result = 1;
  for (const value of arr) {
    if (typeof value === "function") {
      result *= value(context);
    } else {
      result *= value;
    }
  }
  return result;
}

function getBasicRate(context) {
  const {special, element, targetElement, buff, debuff} = context;
  
  const baseRate = BASE_RATE[
    special.element?.[0] ||
    targetElement in BASE_RATE && targetElement ||
    getElementAffinity(element, targetElement)
  ];
  
  const r = {};
  for (const key in baseRate) {
    let value = baseRate[key] + sum(special[key], context);
    if (key === "critRate" && buff.crit) {
      value += 0.3;
    }
    if (key === "missRate" && debuff.miss) {
      value += 0.5;
    }
    r[key] = Math.min(Math.max(value, 0), 1);
  }
  
  return r;
}

function getElementBonus(context) {
  const {r, special} = context;
  return r.missRate * 0.7
    // FIXME: do they add up?
    + (1-r.missRate) * r.critRate * 1.5 * product(special.extraDamageOnCrit, context)
    + (1-r.missRate) * (1-r.critRate) * r.heavyRate * 1.3
    + (1-r.missRate) * (1-r.critRate) * (1-r.heavyRate) * 1;
}

function getDefBonus(context) {
  const {r, targetDef, targetDebuff} = context;
  return r.ignoreDefRate * 1 +
    (1-r.ignoreDefRate) * (750 / (750 + targetDef * (targetDebuff.def ? 0.3 : 1)));
}

function getCondBonus(context) {
  const {special} = context;
  return product(special.condBonus, context);
}

function getHpPctBonus(context) {
  const {scaleByHp, scaleByTargetHp} = context.special;
  return scale(sum(scaleByHp), context.hpPct) * scale(sum(scaleByTargetHp), context.targetHpPct);
  
  function scale(type, pct) {
    if (!type) return 1;
    if (type > 0) {
      return 1 + 0.8 * pct;
    }
    return 1 + 0.8 * (1 - pct);
  }
}

export function simulateSkillMod({
  dress,
  turn: maxTurn = 5,
  targetElement,
  targetDef,
  buff,
  debuff,
  targetBuff,
  targetDebuff,
  targetHpPct = 1,
  hpPct = 1,
  useCut = false,
  targetNumber = 1,
  endlessMode,
  recastReduction = [],
  extraDamageElement
}) {
  const skillData = skillMap.get(dress.name);
  if (!skillData) throw new Error(`missing skill data for ${dress.name}`);
  
  const skills = skillData.map((rawData, index) => {
    const context = {
      buff,
      debuff,
      targetBuff,
      targetDebuff,
      special: rawData.special,
      element: dress.element,
      targetElement,
      targetDef,
      targetNumber,
      hpPct,
      targetHpPct,
      extraDamageElement
    };
    
    context.r = getBasicRate(context);
    
    return {
      index,
      mod: buildMod({
        skill: rawData.skill,
        bonus: dress.skill[index].bonus,
        elementBonus: getElementBonus(context),
        defBonus: getDefBonus(context),
        condBonus: getCondBonus(context),
        hpPctBonus: getHpPctBonus(context),
        extraDamage: extraDamageElement !== "none" && extraDamageElement === dress.element,
        cut: useCut ? sum(rawData.special?.cutRate, context) : 0,
        buff,
        debuff,
        targetNumber,
        endlessMode,
      }),
      cd: dress.skill[index].cd?.[1] || 1,
      sleep: 0,
      recast: sum(rawData.special?.recast),
      prefer: []
    };
  }).reverse();
  
  // FIXME: currently we only calculate `prefer` for 1cd skill. does it also work for other skills?
  for (const skill of skills) {
    if (skill.cd > 1) continue;
    
    for (const s of skills) {
      if (s !== skill && cmpMod(s.mod, skill.mod) > 0) {
        skill.prefer.push(s.index);
      }
    }
  }
  
  // if we use s1 while s2 is not in cd, add s2 to deadzone so we only generate rotation like
  // 21112... instead of 12111...
  let deadZone = new Set;
  const results = [];
  
  search(0, Array(skills.length).fill(0), {}, []);
  
  return results;
  
  function search(turn, sleep, mod, history) {
    if (turn >= maxTurn) {
      for (let i = 0; i < results.length; i++) {
        const r1 = cmpMod(mod, results[i].mod);
        if (r1 > 0) {
          results[i] = {history: history.slice(), mod};
          return;
        }
        const r2 = cmpMod(results[i].mod, mod);
        if (r2 > 0) {
          return;
        }
        if (r1 === r2 && r1 === 0) return;
      }
      results.push({history: history.slice(), mod});
      return;
    }
    
    for (const skill of skills) {
      if (sleep[skill.index] > 0) continue;
      
      if (skill.prefer.some(i => sleep[i] <= 0)) continue;
      
      if (deadZone.has(skill.index)) continue;
      
      let oldDeadZone;
      if (skill.cd === 1) {
        oldDeadZone = new Set(deadZone);
        for (const s of skills) {
          if (s === skill || sleep[s.index] > 0) continue;
          deadZone.add(s.index);
        }
      }
      
      const newMod = addMod(mod, skill.mod);
      const newSleep = sleep.slice();
      newSleep[skill.index] = skill.cd;      
      for (let i = 0; i < newSleep.length; i++) {
        newSleep[i] += skill.recast - 1 - (recastReduction.length > turn ? recastReduction[turn] : 0);
      }
      history.push(skill.index);
      
      search(turn + 1, newSleep, newMod, history);
      
      history.pop();
      if (oldDeadZone) {
        deadZone = oldDeadZone;
      }
    }
  }
}

function buildMod({
  skill,
  bonus,
  elementBonus,
  defBonus,
  condBonus,
  hpPctBonus,
  cut,
  buff,
  debuff,
  targetNumber,
  endlessMode,
  extraDamage
}) {
  const result = {};
  skill.forEach((part, i) => {
    for (let key in part.mod) {
      const value = part.mod[key];
      let fixed = false;
      if (key.startsWith("fixed")) {
        fixed = true;
        key = key[5].toLowerCase() + key.slice(6);
      }
      result[key] = (result[key] || 0) +
        value *
        (100 + bonus) / 100 *
        (fixed ? 1 : elementBonus) *
        (fixed ? 1 : defBonus) *
        getBuffValue(buff, debuff, key) * // FIXME: does buff affect fixed damage?
        hpPctBonus *
        condBonus *
        part.hits *
        (part.aoe ? targetNumber : 1) *
        getEndlessBonus(endlessMode, part.hits, i > 0) *
        (extraDamage ? 1.5 : 1);
    }
  });
  if (cut) {
    result.targetHp = (result.targetHp || 0) + cut * 0.05 * 0.85;
  }
  return result;
}

function getEndlessBonus(mode, hits, isSecondPart) {
  if (mode === "s3") {
    if (isSecondPart) return 5;
    if (hits <= 1) return 1;
    return ((hits - 1) * 5 + 1) / hits;
  }
  
  if (mode === "s4") {
    if (isSecondPart) return 1;
    if (hits <= 1) return 6;
    return (6 + (hits - 1)) / hits;
  }
  
  return 1;
}

function addMod(a, b) {
  const result = {...a};
  for (const key in b) {
    result[key] = (result[key] || 0) + b[key];
  }
  return result;
}

function cmpMod(a, b) {
  for (const key in b) {
    if (!(key in a) || a[key] < b[key]) return -1;
  }
  for (const key in a) {
    if (!(key in b) || a[key] > b[key]) return 1;
  }
  return 0;
}
