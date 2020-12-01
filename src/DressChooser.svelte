<script>
import allDressInfo from "../dress-db.yml";

import {getStore} from "./store.mjs";
import {_d} from "./i18n.mjs";

const includedDresses = getStore("includedDresses", []);
const maxLvDresses = getStore("maxLVDresses", []);

function maxNR() {
  const current = new Set($maxLvDresses);
  const included = new Set($includedDresses);
  maxLvDresses.set(
    allDressInfo
      .filter(d => included.has(d.name) && 
        (current.has(d.name) || ["N", "R"].includes(d.rarity)))
      .map(d => d.name)
  );
}

function maxEvents() {
  const current = new Set($maxLvDresses);
  const included = new Set($includedDresses);
  maxLvDresses.set(
    allDressInfo
      .filter(d => included.has(d.name) &&
        (current.has(d.name) || d.pool === "event"))
      .map(d => d.name)
  );
}
</script>

<div class="container">
  <label for="includedDresses" class="included-dress-label">Dresses you have</label>
  <select id="includedDresses" multiple bind:value={$includedDresses}>
    {#each allDressInfo as dress}
      <option value={dress.name}>{$_d(dress.name)}</option>
    {/each}
  </select>
  
  <label for="maxLvDresses">Dresses with max level</label>
  <select id="maxLvDresses" multiple bind:value={$maxLvDresses}>
    {#each $includedDresses as dressName}
      <option value={dressName}>{$_d(dressName)}</option>
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