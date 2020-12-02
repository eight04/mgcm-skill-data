<script>
import DressTable from "./DressTable.svelte";

import {getStore} from "./store.mjs";
import {simulateSubDress} from "./simulate.mjs";
import {_d} from "./i18n.mjs";

const includedDresses = getStore("includedDresses", []);
const maxLvDresses = getStore("maxLVDresses", []);
let choosedDress = $includedDresses[0];
let focusOn = "dps";
let orbRarity = "sr";

let result;
let resultErr;

async function simulate() {
  try {
    result = await simulateSubDress({
      includedDresses: $includedDresses,
      maxLvDresses: $maxLvDresses,
      mainDressName: choosedDress,
      focusOn,
      orbRarity
    });
    resultErr = false;
  } catch (err) {
    console.error(err);
    result = err;
    resultErr = true;
  }
}
</script>

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
  Focus on
  <select id="focusOn" bind:value={focusOn}>
    <option value="dps">DPS</option>
    <option value="hp">HP</option>
    <option value="atk">ATK</option>
    <option value="def">DEF</option>
    <option value="spd">SPD</option>
    <option value="fcs">FCS</option>
    <option value="rst">RST</option>
  </select>
</label>

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
    <div class="help">* = sub element orb</div>
    <DressTable dresses={result.subDresses}></DressTable>
  {/if}
{/if}

<style>
.result-err {
  color: red;
}
</style>