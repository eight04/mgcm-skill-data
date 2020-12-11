const BUFF_VALUE = {
  atk: 1.5,
  def: 1.7,
  spd: 1.3
};

export function calcScore(stat, mod, buff) {
  let score = 0;
  for (const key in mod) {
    score += (stat[key] || 0) * mod[key] * (buff[key] && BUFF_VALUE[key] || 1);
  }
  return score;
}

export function cmpScore(a, b) {
  return a.score - b.score;
}
