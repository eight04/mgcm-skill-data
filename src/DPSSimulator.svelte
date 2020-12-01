<script>
import {getStore} from "./store.mjs";
import {simulateDps} from "./simulate.mjs";
import {_d} from "./i18n.mjs";

const includedDresses = getStore("includedDresses", []);
const maxLvDresses = getStore("maxLVDresses", []);

let ignoreElement = false;
let orbRarity = "sr";
let buff = [];

let running = false;
let result;
let resultErr;
let maxScore;

const BUFF_VALUE = {
  atk: 1.5,
  def: 1.7,
  spd: 1.3
};

async function simulate() {
  running = true;
  try {
    result = await simulateDps({
      includedDresses: $includedDresses,
      maxLvDresses: $maxLvDresses,
      ignoreElement,
      orb: orbRarity,
      buff: Object.fromEntries(buff.map(b => [b, BUFF_VALUE[b]]))
    });
    resultErr = false;
    maxScore = result[0].score;
  } catch (err) {
    result = err;
    resultErr = true;
  }
  running = false;
}
</script>

<label>
  <input type="checkbox" bind:checked={ignoreElement}>
  Use sub element orbs
</label>

<div class="radio-group">
  <div class="radio-title">Orb rarity</div>
  <label>
    <input type="radio" bind:group={orbRarity} value="sr">
    SR
  </label>
  <label>
    <input type="radio" bind:group={orbRarity} value="ur">
    UR
  </label>
</div>

<div class="radio-group">
  <div class="radio-title">Buff</div>
  <label>
    <input type="checkbox" bind:group={buff} value="atk">
    ATK
  </label>
  <label>
    <input type="checkbox" bind:group={buff} value="def">
    DEF
  </label>
  <label>
    <input type="checkbox" bind:group={buff} value="spd">
    SPD
  </label>
</div>

<div class="action">
  <button on:click={simulate} disabled={running}>Simulate</button>
</div>

{#if result}
  {#if resultErr}
    <div class="result-err">
      {String(result)}
    </div>
  {:else}
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>%</th>
          <th>Main</th>
          <th>Orb</th>
          <th>Sub</th>
          <th>Orb</th>
        </tr>
      </thead>
      <tbody>
        {#each result as row, i}
          <tr>
            <td rowspan="4">{i + 1}</td>
            <td rowspan="4">{(row.score * 100 / maxScore).toFixed(2)}</td>
            <td rowspan="4">{$_d(row.mainDress.dress.name)}</td>
            <td rowspan="4">{row.mainDress.orb.name}</td>
            <td>{$_d(row.subDresses[0].dress.name)}</td>
            <td>{row.subDresses[0].orb.name}</td>
          </tr>
          {#each row.subDresses.slice(1) as sub}
            <tr>
              <td>{$_d(sub.dress.name)}</td>
              <td>{sub.orb.name}{sub.ignoreElement ? "*" : ""}</td>
            </tr>
          {/each}
        {/each}
      </tbody>
    </table>
  {/if}
{/if}

<style>
.result-err {
  color: red;
}
table {
  border-collapse: collapse;
}
table, td, th {
  border: 1px solid grey;
}
th, td {
  padding: .2em .6em;
}
.radio-title {
  margin: .3em 0;
}
.radio-group {
  margin: .6em 0;
}
</style>