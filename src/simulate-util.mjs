export function calcScore(stat, mod, buff) {
  let score = 0;
  for (const key in mod) {
    score += (stat[key] || 0) * mod[key] * (buff[key] || 1);
  }
  return score;
}

export function cmpScore(a, b) {
  return a.score - b.score;
}
