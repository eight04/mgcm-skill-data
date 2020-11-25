
import {getAllDresses, getAllSkills} from "./lib/util.mjs";
import {simulate} from "./lib/simulate.mjs";

const allDresses = await getAllDresses();

const result = await simulate({
  allDresses,
  allSkillMod: await getAllSkills(),
  exclude: allDresses.filter(d => d.id > 3902806).map(d => d.name), // until real maid series
  maxLvDresses: allDresses.filter(isCommon).map(d => d.name)
  // maxLvDresses: allDresses.map(d => d.name),
  // ignoreElement: true,
  // orb: "ur",
  // buff: {
    // atk: 1.5,
    // def: 1.7,
    // spd: 1.3
  // }
});

const header = [
  "score", "mainDress", "orb",
  ...[1, 2, 3, 4].map(n => [`subDress${n}`, "orb"]).flat()
];

console.log(header.join(","));

for (const r of result) {
  const row = [
    r.score,
    r.mainDress.dress.name,
    r.mainDress.pearl,
    ...r.subDresses.map(d => [d.dress.name, d.pearl]).flat()
  ];
  console.log(row.join(","));
}

function isCommon(dress) {
  return ["R", "N"].includes(dress.rarity)
    || dress.pool === "event"
    || dress.pool === "story";
}
