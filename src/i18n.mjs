import {derived} from "svelte/store";
import allDresses from "./i18n-all-dresses.yml";
import allChars from "./i18n-characters.yml";
import {getStore} from "./store.mjs";

const dressMap = new Map(allDresses.map(d => [d.jp, d]));
const charMap = new Map(allChars.map(c => [c.jp, c]));

export const language = getStore("language", "en");

export const _d = derived(language, value => formatDress.bind(null, value));

function formatDress(lang, dressName) {
  const t = dressName.split(" ");
  const charName = t.pop();
  const seriesName = t.join(" ");
  const dress = dressMap.get(seriesName);
  if (!dress) return dressName;
  const char = charMap.get(charName);
  return `${dress[lang] || dress.jp} ${char[lang] || char.jp}`;
}
