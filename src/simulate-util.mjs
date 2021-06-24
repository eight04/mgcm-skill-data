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

export function calcScore(stat, mod, leaderBuff) {
  let score = 0;
  for (const key in mod) {
    let statValue = stat[key] || 0;
    if (leaderBuff && leaderBuff.type.startsWith(key)) {
      if (leaderBuff.type.endsWith("%")) {
        statValue *= (leaderBuff.value + 100) / 100;
      } else {
        statValue += leaderBuff.value;
      }
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
