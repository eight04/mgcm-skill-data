<script>
import {derived} from "svelte/store";

import allDresses from "./i18n-all-dresses.yml";
import allDressInfo from "../dress-db.yml";

import {getStore} from "./store.mjs";
import {_d} from "./i18n.mjs";

const dressMap = new Map(allDressInfo.map(d => [d.name, d]));

const includedDresses = getStore("includedDresses", []);
let includedDressObj;
$: includedDressObj = derived(includedDresses, names => {
  const set = new Set(names);
  return allDresses.filter(d => set.has(d.jp));
});
const maxLvDresses = getStore("maxLVDresses", []);

function isIncluded(dress) {
  return includedDressSet.has(dress.jp);
}

function maxNR() {
  const current = new Set($maxLvDresses);
  maxLvDresses.set(
    $includedDressObj
      .filter(d => current.has(d.jp) || ["N", "R"].includes(dressMap.get(d.jp).rarity))
      .map(d => d.jp)
  );
}

function maxEvents() {
  const current = new Set($maxLvDresses);
  maxLvDresses.set(
    $includedDressObj
      .filter(d => current.has(d.jp) || dressMap.get(d.jp).pool === "event")
      .map(d => d.jp)              
  );
}
</script>

<div class="container">
  <label for="includedDresses" class="included-dress-label">Dresses you have</label>
  <select id="includedDresses" multiple bind:value={$includedDresses}>
    {#each allDresses as dress (dress.jp)}
      <option value={dress.jp}>{_d(dress)}</option>
    {/each}
  </select>
  
  <label for="maxLvDresses">Dresses with max level</label>
  <select id="maxLvDresses" multiple bind:value={$maxLvDresses}>
    {#each $includedDressObj as dress (dress.jp)}
      <option value={dress.jp}>{_d(dress)}</option>
    {/each}
  </select>
  <div class="actions">
    <button on:click={maxNR}>Select all N/R dresses</button>
    <button on:click={maxEvents}>Select all event dresses</button>
  </div>
</div>

<style>
.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr auto;
  height: 80vh;
}
.included-dress-label {
  grid-columns: 1 / 2;
  grid-rows: 1 / 2;
}
#includedDresses {
  grid-column: 1 / 2;
  grid-row: 2 / 4;
}
</style>