const BUFF_VALUE = {
  atk: 0.5,
  def: 0.7,
  spd: 0.3
};

export function getBuffValue(buff, debuff, key) {
  if (buff[key] == debuff[key] || !BUFF_VALUE[key]) return 1;
  if (buff[key]) return 1 + BUFF_VALUE[key];
  return 1 - BUFF_VALUE[key];
}

export function calcScore(stat, mod, bonusList) {
  const bonusMap = {};
  for (const bonus of bonusList) {
    if (!bonusMap[bonus.type]) {
      bonusMap[bonus.type] = 0;
    }
    bonusMap[bonus.type] += bonus.value;
  }
  let score = 0;
  for (const key in mod) {
    let statValue = stat[key] || 0;
    if (bonusMap[key + "%"]) {
      statValue *= (bonusMap[key + "%"] + 100) / 100;
    }
    if (bonusMap[key]) {
      statValue += bonusMap[key];
    }
    score += statValue * mod[key];
  }
  return score;
}

export function cmpScore(a, b) {
  return a.score - b.score;
}

export const charGroup = {
  "いろは": 1,
  "花織": 1,
  "マリアンヌ": 1,
  "セイラ": 2,
  "ここあ": 2,
  "丹": 2,
  "陽彩": 3,
  "蒼": 3,
  "依子": 3,
  "エリザ": 4,
  "りり": 4,
  "はなび": 4
};
