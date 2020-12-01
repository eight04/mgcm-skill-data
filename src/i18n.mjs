import {derived} from "svelte/store";
import allDresses from "./i18n-all-dresses.yml";
import {getStore} from "./store.mjs";

const dressMap = new Map(allDresses.map(d => [d.jp, d]));

export const language = getStore("language", "en");

export const _d = derived(language, value => formatDress.bind(null, value));

function formatDress(lang, dressName) {
  const dress = dressMap.get(dressName);
  return dress[lang] || dress.jp;
}
