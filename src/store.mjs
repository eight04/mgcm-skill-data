/* eslint-env browser */

import {writable} from "svelte/store";

export function getStore(name, default_) {
  const store = writable(
    parseJSON(localStorage.getItem(`mgcm-skill-data/${name}`)) ??
    default_
  );
  store.subscribe(value => 
    localStorage.setItem(`mgcm-skill-data/${name}`, JSON.stringify(value))
  );
  return store;
}

function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    // pass
  }
}
