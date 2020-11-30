/* eslint-env browser */

import {writable} from "svelte/store";

const cache = new Map;

export function getStore(name, default_) {
  if (cache.has(name)) return cache.get(name);
  
  const store = writable(
    parseJSON(localStorage.getItem(`mgcm-skill-data/${name}`)) ??
    default_
  );
  store.subscribe(value => 
    localStorage.setItem(`mgcm-skill-data/${name}`, JSON.stringify(value))
  );
  
  cache.set(name, store);
  return store;
}

function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    // pass
  }
}
