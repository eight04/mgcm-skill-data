export function simulate({
  allDresses,
  allSkillMod,
  exclude = [],
  maxLvDresses = [],
  ignoreElement = false,
  turn = 5,
  orb = "sr",
  buff = {}
}) {
  exclude = new Set(exclude);
  maxLvDresses = new Set(maxLvDresses);
  
  for (const dress of allDresses) {
    for (const stat of ["hp", "atk", "def", "spd", "fcs", "rst"]) {
      if (Array.isArray(dress[stat])) {
        dress[stat] = dress[stat][maxLvDresses.has(dress.name) ? 2 : 1];
      }
    }
  }
  
  const nameIndex = new Map(allDresses.map(d => [d.name, d]));
  const result = [];
  
  for (const skill of allSkillMod) {
    if (exclude.has(skill.name)) continue;
    
    const finalMod = getFinalMod(skill, nameIndex.get(skill.name).skill, turn);
    
    const allSubDresses = [];
    const mainChar = skill.name.split(" ").pop();
    const mainElement = nameIndex.get(skill.name).element;
    
    for (const dress of allDresses) {
      if (dress.name === skill.name || exclude.has(dress.name)) continue;
      
      const subChar = dress.name.split(" ").pop();
      const subElement = dress.element;
      const ratio = 20 +
        (mainChar === subChar ? 5 : 0) +
        (mainElement === subElement || ignoreElement ? 5 : 0);
        
      allSubDresses.push(buildDress({
        dress,
        mod: finalMod,
        subRatio: ratio / 100,
        orb,
        buff
      }));
    }
    
    allSubDresses.sort((a, b) => a.score - b.score);
    
    const subDresses = allSubDresses.slice(-5);
    const mainDress = buildDress({
      dress: nameIndex.get(skill.name),
      mod: finalMod,
      orb,
      buff
    });
    result.push({
      score: mainDress.score + subDresses.reduce((n, d) => n + d.score, 0),
      mainDress,
      subDresses
    });
  }
  
  result.sort((a, b) => a.score - b.score);
  
  return result;
}

function getFinalMod(skill, skillInfo, turn) {
  const skills = skill.mods.map((mod, i) => ({
    mod,
    cd: skillInfo[i].cd?.[1] || 1,
    bonus: skillInfo[i].bonus,
    sleep: 0
  })).sort(compareSkill);
  
  const finalMod = {};
  
  for (let i = 0; i < turn; i++) {
    const s = skills.filter(s => !s.sleep).pop();
    s.sleep = s.cd;
    addMod(finalMod, s.mod);
    
    for (const s of skills) {
      if (s.sleep) s.sleep--;
    }
  }
  
  return finalMod;
}

function buildDress({
  dress,
  mod, 
  subRatio = 1,
  orb = "sr",
  buff = {}
}) {
  const pearl = [...generatePearls(dress, orb)]
    .map(([name, p]) => ({
      score: calcScore(p, mod, buff),
      name
    }))
    .sort((a, b) => a.score - b.score)
    .pop();
    
  return {
    score: (calcScore(dress, mod, buff) + pearl.score) * subRatio,
    dress,
    pearl: pearl.name
  };
}

function addMod(a, b) {
  for (const key in b) {
    if (a[key]) {
      a[key] += b[key];
    } else {
      a[key] = b[key];
    }
  }
}

function compareSkill(a, b) {
  if (Object.keys(b).every(k => a[k] > b[k])) return 1;
  if (Object.keys(b).every(k => a[k] < b[k])) return -1;
  
  // FIXME: is this the best way to choose skill?
  return a.cd - b.cd;
}

const FLAT_ORBS = {
  hp: [4240, 5220],
  atk: [270, 345],
  def: [270, 345],
  spd: [45, 60],
  fcs: [65, 80],
  rst: [65, 80]
};

function *generatePearls(dress, rarity) {
  // SR pearls
  for (const stat of ["hp", "atk", "def"]) {
    yield [`${stat}%`, {
      [stat]: dress[stat] * (rarity === "ur" ? 0.65 : 0.5)
    }];
  }
  for (const [stat, value] of Object.entries(FLAT_ORBS)) {
    yield [stat, {[stat]: value[rarity === "ur" ? 1 : 0]}];
  }
}

function calcScore(dress, mod, buff) {
  let score = 0;
  for (const stat in mod) {
    score += (dress[stat] || 0) * mod[stat] * (buff[stat] || 1);
  }
  return score;
}
