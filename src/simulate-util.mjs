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

export function calcScore(stat, mod) {
  let score = 0;
  for (const key in mod) {
    score += (stat[key] || 0) * mod[key];
  }
  return score;
}

export function cmpScore(a, b) {
  return a.score - b.score;
}
