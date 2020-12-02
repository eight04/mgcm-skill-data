<script>
import DressLink from "./DressLink.svelte";

import {getStore} from "./store.mjs";
import {simulateDps} from "./simulate.mjs";

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

function getOrbName(build) {
  return `${build.orb.name}${build.ignoreElement ? "*" : ""}`;
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
            <td rowspan="4">
              <DressLink dress={row.mainDress.dress}></DressLink>
            </td>
            <td rowspan="4">{row.mainDress.orb.name}</td>
            <td>
              <DressLink dress={row.subDresses[0].dress}></DressLink>
            </td>
            <td>
              {getOrbName(row.subDresses[0])}
            </td>
          </tr>
          {#each row.subDresses.slice(1) as sub}
            <tr>
              <td>
                <DressLink dress={sub.dress}></DressLink>
              </td>
              <td>{getOrbName(sub)}</td>
            </tr>
          {/each}
        {/each}
      </tbody>
    </table>
  {/if}
{:else}
  <p>
    DPS is calculated with following rules:
  </p>

  <ul>
    <li>Simulate 5 turns.</li>
    <li>Try to use the skill with highest modifier or longest CD.</li>
    <li>All skills are lv. max.</li>
    <li>Conditional bonus are not calculated e.g. <a href="https://appmedia.jp/magicami/3790342">Magica2061 はなび</a>.</li>
    <li>Critical/Heavy blow rate increase are not considered e.g. <a href="https://appmedia.jp/magicami/3790402">デモンズスタイルアラクネ いろは</a>, <a href="https://appmedia.jp/magicami/3790336">Magica2061 エリザ</a>.</li>
  </ul>
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
li {
  margin-top: .3em;
  margin-bottom: .3em;
}
</style>