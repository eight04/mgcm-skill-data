<script>
import DressLink from "./DressLink.svelte";
import BuffChooser from "./BuffChooser.svelte";

import {getStore} from "./store.mjs";
import {simulateDps} from "./simulate.mjs";

const includedDresses = getStore("includedDresses", []);
const maxLvDresses = getStore("maxLVDresses", []);

let ignoreElement = false;
let orbRarity = "sr";
let buff = [];
let target = {hp: 0, def: 0, element: "neutral"};
let targetDebuff = [];
let targetDebuffCut = 0;

let running = false;
let result;
let resultErr;
let maxScore;

async function simulate() {
  running = true;
  try {
    result = await simulateDps({
      includedDresses: $includedDresses,
      maxLvDresses: $maxLvDresses,
      ignoreElement,
      orb: orbRarity,
      buff,
      targetDebuff: [...targetDebuff, ...Array(targetDebuffCut).fill("cut")],
      target
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
  return build.orb.name;
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

<BuffChooser bind:buff={buff}></BuffChooser>

<div class="radio-group">
  <div class="radio-title">Target debuff</div>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="atk">
    ATK
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="def">
    DEF
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="spd">
    SPD
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="fcs">
    FCS
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="rst">
    RST
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="taunt">
    Taunt
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="noRecovery">
    No recovery
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="noBuff">
    No buff
  </label>
  <label>
    Cut
    <input type="number" bind:value={targetDebuffCut} />
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="sleep">
    Sleep
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="stun">
    Stun
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="oblivion">
    Oblivion
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="miss">
    Miss rate
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="silence">
    Silence
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="burn">
    Burn
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="shock">
    Shock
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="freeze">
    Freeze
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="seal">
    Seal
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="confusion">
    Confusion
  </label>
  <label>
    <input type="checkbox" bind:group={targetDebuff} value="poison">
    Poison
  </label>
</div>

<label>
  Target HP
  <input type="number" bind:value={target.hp}>
</label>

<label>
  Target DEF
  <input type="number" bind:value={target.def}>
</label>

<label>
  Target element
  <select bind:value={target.element}>
    <option value="fire">Fire</option>
    <option value="lightning">Lightning</option>
    <option value="water">Water</option>
    <option value="dark">Dark</option>
    <option value="light">Light</option>
    <option value="neutral">Neutral</option>
    <option value="superior">Always superior</option>
    <option value="inferior">Always inferior</option>
  </select>
</label>

<div class="actions">
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
          <th>Score</th>
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
            <td rowspan="4">{row.score.toFixed(2)}</td>
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
    DPT is calculated with following rules:
  </p>

  <ul>
    <li>Simulate 5 turns and calculate average damage.</li>
    <li>Try to use the skill with highest modifier or longest CD.</li>
    <li>All skills are lv. max.</li>
    <li>Conditional bonus are calculated e.g. <a href="https://appmedia.jp/magicami/3790342">Magica2061 はなび</a>.</li>
    <li>Critical/Heavy blow rate increase are considered e.g. <a href="https://appmedia.jp/magicami/3790402">デモンズスタイルアラクネ いろは</a>, <a href="https://appmedia.jp/magicami/3790336">Magica2061 エリザ</a>.</li>
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
.radio-group, .actions {
  margin: .6em 0;
}
.radio-group label {
  display: inline-block;
  margin-right: .6em;
}
li {
  margin-top: .3em;
  margin-bottom: .3em;
}
</style>