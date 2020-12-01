import {readFile} from "fs/promises";
import YAML from "yaml";

import {getAllDresses} from "./lib/util.mjs";

const allDresses = new Map([...new Set((await getAllDresses()).map(getSeriesName))].map(name => [name, {jp: name}]));

const oldData = YAML.parse(await readFile("src/i18n-all-dresses.yml", "utf8")) || [];
for (const dress of oldData) {
  if (Object.keys(dress).length === 1 || !allDresses.has(dress.jp)) continue;
  allDresses.set(dress.jp, dress);
}

console.log(YAML.stringify([...allDresses.values()]));

function getSeriesName(dress) {
  const t = dress.name.split(" ");
  t.pop();
  return t.join(" ");
}
