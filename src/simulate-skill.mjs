import allSkillData from "./skill-data.yml";

const SPECIALS = {
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
  }
};

export const skillMap = new Map(allSkillData.map(s => [s.name, compileSkill(s)]));

// FIXME: should we move this to build-time?
function compileSkill({name, mods, special, passive}) {
  const result = [];
  for (let i = 0; i < mods.length; i++) {
    result.push({
      mod: mods[i],
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

function getSpecialBonus({
  special,
  element,
  targetDef = 0,
  targetElement,
  
  buff = {},
  debuff = {},
  targetBuff = {},
  targetDebuff = {length: 0}
}) {
  const context = {buff, debuff, targetBuff, targetDebuff};
  
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
    r[key] = Math.min(Math.max(value, 0), 1);
  }
  
  const elementBonus = r.missRate * 0.7
    // FIXME: do they add up?
    + (1-r.missRate) * r.critRate * 1.5 * product(special.extraDamageOnCrit, context)
    + (1-r.missRate) * (1-r.critRate) * r.heavyRate * 1.3
    + (1-r.missRate) * (1-r.critRate) * (1-r.heavyRate) * 1;
    
  const condBonus = product(special.condBonus, context);
    
  const defBonus = r.ignoreDefRate * 1 +
    (1-r.ignoreDefRate) * (750 / (750 + targetDef * (targetDebuff.def ? 0.3 : 1)));
    
  return elementBonus * condBonus * defBonus;
}

export function simulateSkillMod({
  dress,
  turn: maxTurn = 5,
  targetElement,
  targetDef,
  buff,
  debuff,
  targetBuff,
  targetDebuff
}) {
  const skillData = skillMap.get(dress.name);
  if (!skillData) throw new Error(`missing skill data for ${dress.name}`);

  const skills = skillData.map((s, i) => ({
    index: i,
    mod: s.mod,
    cd: dress.skill[i].cd?.[1] || 1,
    bonus: dress.skill[i].bonus,
    sleep: 0,
    recast: sum(s.special?.recast),
    specialBonus: getSpecialBonus({
      special: s.special,
      element: dress.element,
      targetElement,
      targetDef,
      buff,
      debuff,
      targetBuff,
      targetDebuff
    }),
    prefer: [],
    cut: 0
  })).reverse();
  
  // FIXME: currently we only calculate `prefer` for 1cd skill. does it also work for other skills?
  for (const skill of skills) {
    if (skill.cd > 1) continue;
    
    for (const s of skills) {
      if (s !== skill && cmpSkill(s, skill) > 0) {
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
      
      const newMod = addMod(mod, skill.mod, skill.bonus, skill.specialBonus);
      const newSleep = sleep.slice();
      newSleep[skill.index] = skill.cd;      
      for (let i = 0; i < newSleep.length; i++) {
        newSleep[i] += skill.recast - 1;
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

function addMod(a, b, bonus, special) {
  const result = {...a};
  for (const key in b) {
    if (result[key]) {
      result[key] += b[key] * (100 + bonus) / 100 * special;
    } else {
      result[key] = b[key] * (100 + bonus) / 100 * special;
    }
  }
  return result;
}

function cmpSkill(a, b) {
  const r = cmpMod(a.mod, b.mod);
  if (r > 0 && a.cut >= b.cut) {
    return 1;
  }
  if (r === 0 && a.cut > b.cut) {
    return 1;
  }
  if (r === 0 && a.cut === b.cut) {
    return 0;
  }
  return -1;
}

function cmpMod(a, b) {
  let greater = false;
  for (const key in b) {
    if (!(key in a) || a[key] < b[key]) return -1;
    if (a[key] > b[key]) greater = true;
  }
  return greater ? 1 : 0;
}
