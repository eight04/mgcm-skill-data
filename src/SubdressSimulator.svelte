<script>
import DressTable from "./DressTable.svelte";

import {getStore} from "./store.mjs";
import {simulateSubDress} from "./simulate.worker.mjs";
import {_d} from "./i18n.mjs";

const includedDresses = getStore("includedDresses", []);
const maxLvDresses = getStore("maxLVDresses", []);
let choosedDress = $includedDresses[0];
let focusType = "stat";
let focusOn = "atk";
let orbRarity = "sr";
let customMod = "";
let useSubGroup = false;

let result;
let resultErr;

export function setCustomMod({dressName, mod}) {
  focusType = "mod";
  customMod = JSON.stringify(mod, null, 2);
  choosedDress = dressName;
  result = null;
}

async function simulate() {
  try {
    result = await simulateSubDress({
      includedDresses: $includedDresses,
      maxLvDresses: $maxLvDresses,
      mainDressName: choosedDress,
      focusOn,
      orbRarity,
      mod: focusType === "mod" ?
        JSON.parse(customMod) : {[focusOn]: 1},
      useSubGroup
    });
    resultErr = false;
  } catch (err) {
    console.error(err);
    result = err;
    resultErr = true;
  }
}
</script>

<div class="input-group">
  <select id="choosedDress" bind:value={choosedDress}>
    {#each $includedDresses as name}
      <option value={name}>{$_d(name)}</option>
    {/each}
  </select>
  <label>
    Orb rarity
    <select bind:value={orbRarity}>
      <option value="sr">SR</option>
      <option value="ur">UR</option>
    </select>
  </label>
  <label>
    <input type="checkbox" bind:checked={useSubGroup}>
    Use subdress group  <a href="https://github.com/eight04/mgcm-skill-data/issues/50">Learn more</a>
  </label>
</div>

<div class="check-group">
  <div class="check-title">
    Score function
  </div>
  <label>
    <input type="radio" value="stat" bind:group={focusType}>
    Base on status
    <fieldset disabled={focusType !== "stat"}>
      <label>
        Focus on
        <select id="focusOn" bind:value={focusOn}>
          <option value="hp">HP</option>
          <option value="atk">ATK</option>
          <option value="def">DEF</option>
          <option value="spd">SPD</option>
          <option value="fcs">FCS</option>
          <option value="rst">RST</option>
        </select>
      </label>
    </fieldset>
  </label>
  <label>
    <input type="radio" value="mod" name="" bind:group={focusType}>
    <span class="input-title">Custom mod</span>
    <fieldset disabled={focusType !== "mod"}>
      <textarea bind:value={customMod}></textarea>
    </fieldset>
  </label>
</div>

<button on:click={simulate}>Simulate</button>

{#if result}
  {#if resultErr}
    <div class="result-err">
      {String(result)}
    </div>
  {:else}
    <h3>Main</h3>
    <DressTable dresses={[result.mainDress]}></DressTable>
    <h3>Subs</h3>
    <DressTable dresses={result.subDresses} baseScore={result.mainDress.score}></DressTable>
  {/if}
{/if}

<style>
.result-err {
  color: red;
}
.input-group {
  margin: .6em 0;
}

.check-title {
  margin: .4em 0;
}
fieldset {
  border: none;
  margin: 0;
  padding: 0 0 0 1.6em;
}
fieldset[disabled] {
  color: grey;
}
textarea {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 6em;
  margin: 0.3em 0;
}
button {
  margin: 0.6em 0;
}
</style>