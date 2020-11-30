<script>
import {NAMES as charNames} from "../tools/lib/chars.mjs";

import {getStore} from "./store.mjs";
import {simulateSubDress} from "./simulate.mjs";

const includedDresses = getStore("includedDresses", []);
const maxLvDresses = getStore("maxLVDresses", []);
let choosedDress;
let focusOn;
let result;

async function simulate() {
  result = await simulateSubDress({
    includedDresses: $includedDresses,
    maxLvDresses: $maxLvDresses,
    mainDress: choosedDress,
    focusOn
  });
}
</script>

<select id="choosedDress" bind:value={choosedDress}>
  {#each $includedDresses as name}
    <option value={name}>{name}</option>
  {/each}
</select>

<label for="focusOn">Focus on</label>
<select id="focusOn" bind:value={focusOn}>
  <option value="dps">DPS</option>
  <option value="hp">HP</option>
  <option value="atk">ATK</option>
  <option value="def">DEF</option>
  <option value="spd">SPD</option>
  <option value="fcs">FCS</option>
  <option value="rst">RST</option>
</select>
<button on:click={simulate}>Simulate</button>

{#if result}
  <div class="table">
    <div class="header">
      <div class="th"></div>
    </div>
  </div>
{/if}