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
      condBonus: ({targetDebuff}) => Object.keys(targetDebuff).length ? 1.5 : 1
    }
  ],
  "ワイン娘 いろは": [
    null,
    null,
    {
      condBonus: ({targetBuff}) => targetBuff.imune.stun ? 1.5 : 1
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
    critRate: ({targetDebuff}) => Object.keys(targetDebuff).length ? 0 : 1
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
  return ({targetDebuff}) => Object.keys(targetDebuff).length * bonus + 1;
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
  targetDebuff = {}
}) {
  const context = {buff, debuff, targetBuff, targetDebuff};
  
  const baseRate = BASE_RATE[
    special.element?.[0] ||
    getElementAffinity(element, targetElement)
  ];
  
  const r = {};
  for (const key in baseRate) {
    r[key] = Math.min(Math.max(baseRate[key] + sum(special[key], context), 0), 1);
  }
  
  const elementBonus = r.missRate * 0.7
    // FIXME: do they add up?
    + (1-r.missRate) * r.critRate * 1.5 * product(special.extraDamageOnCrit, context)
    + (1-r.missRate) * (1-r.critRate) * r.heavyRate * 1.3;
    
  const condBonus = product(special.condBonus, context);
    
  const defBonus = r.ignoreDefRate * 1 +
    (1-r.ignoreDefRate) * (750 / (750 + targetDef));
    
  return elementBonus * condBonus * defBonus;
}

export function simulateSkillMod({
  dress,
  turn = 5,
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
    })
  })).sort(cmpSkill);
  
  const finalMod = {};
  
  for (let i = 0; i < turn; i++) {
    const usedSkill = skills.filter(s => s.sleep <= 0).pop();
    usedSkill.sleep = usedSkill.cd;
    addMod(finalMod, usedSkill.mod, usedSkill.bonus, usedSkill.specialBonus);
    
    for (const s of skills) {
      s.sleep += usedSkill.recast - 1;
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
