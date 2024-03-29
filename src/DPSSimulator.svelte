<script>
/* eslint-env browser */
import { createEventDispatcher } from "svelte";

import DressLink from "./DressLink.svelte";
import BuffChooser from "./BuffChooser.svelte";
import DebuffChooser from "./DebuffChooser.svelte";
import BonusList from "./BonusList.svelte";

import {getStore} from "./store.mjs";
import {simulateDps} from "./simulate.worker.mjs";
import {_d} from "./i18n.mjs";

const dispatchEvent = createEventDispatcher();

const includedDresses = getStore("includedDresses", []);
const maxLvDresses = getStore("maxLVDresses", []);

let turn = getStore("dps/turn", 5);
let ignoreElement = getStore("dps/ignoreElement", false);
let orbRarity = getStore("dps/orbRarity", "sr");
let buff = getStore("dps/buff", []);
let debuff = getStore("dps/debuff", []);
let target = getStore("dps/target", {hp: 0, def: 1000, element: "neutral"});
let targetDebuff = getStore("dps/targetDebuff", []);
let useCut = getStore("dps/useCut", false);
let targetNumber = getStore("dps/targetNumber", 1);
let endlessMode = getStore("dps/endlessMode", "none");
let recastReduction = getStore("dps/recastReduction", "");
// let leaderBuff = getStore("dps/leaderBuff", {type: "atk%", value: 0, element: "water"});
let hpPct = getStore("dps/hpPct", 100);
let targetHpPct = getStore("dps/targetHpPct", 100);
let useSubGroup = getStore("dps/useSubGroup", false);
let extraDamageElement = getStore("dps/extraDamageElement", "none");
let customSkillOrder = getStore("dps/customSkillOrder", "");
let bonusList = getStore("dps/bonusList", []);

let running = false;
let result;
let resultErr;
let maxScore;

let filter = "";

function matchFilter(row, filter) {
  if (!filter) return true;
  const rawName = row.mainDress.dress.name;
  return rawName.includes(filter) || $_d(rawName).includes(filter);
}

async function simulate() {
  running = true;
  try {
    result = await simulateDps({
      includedDresses: $includedDresses,
      maxLvDresses: $maxLvDresses,
      ignoreElement: $ignoreElement,
      orb: $orbRarity,
      buff: $buff,
      debuff: $debuff,
      targetDebuff: $targetDebuff,
      target: $target,
      turn: $turn,
      useCut: $useCut,
      targetNumber: $targetNumber,
      endlessMode: $endlessMode,
      recastReduction: parseNumberList($recastReduction),
      // leaderBuff: $leaderBuff,
      hpPct: $hpPct / 100,
      targetHpPct: $targetHpPct / 100,
      useSubGroup: $useSubGroup,
      extraDamageElement: $extraDamageElement,
      customSkillOrder: parseSkillOrder($customSkillOrder),
      bonusList: $bonusList
    });
    resultErr = false;
    maxScore = result[0].score;
  } catch (err) {
    result = err;
    resultErr = true;
    console.error(err);
  }
  running = false;
}

function openSubs(dressName, mod) {
  dispatchEvent("openSub", {dressName, mod, useSubGroup: $useSubGroup});
}

function getOrbName(build) {
  return build.orb.name;
}

function parseNumberList(s) {
  return s.split(",").map(n => Number(n.trim()));
}

function addCustomSkillOrder(dressName, defaultOrder) {
  const value = prompt("Skill Order:", defaultOrder);
  if (value == null) return;
  
  const obj = parseSkillOrder($customSkillOrder);
  if (!obj[dressName]) {
    obj[dressName] = [];
  }
  obj[dressName].push(value);
  $customSkillOrder = stringifySkillOrder(obj);
}

function parseSkillOrder(s) {
  const obj = {};
  let dressName;
  for (let line of s.trim().split(/\r?\n/)) {
    line = line.trim();
    if (!line) continue;
    if (/^\d+$/.test(line)) {
      if (!dressName) {
        throw new Error("Dress name is missing");
      }
      if (!obj[dressName]) {
        obj[dressName] = [];
      }
      obj[dressName].push(line);
    } else {
      dressName = line;
    }
  }
  return obj;
}

function stringifySkillOrder(obj) {
  const lines = [];
  for (const dressName in obj) {
    lines.push(dressName);
    for (const order of obj[dressName]) {
      lines.push(order);
    }
  }
  return lines.join("\n");
}
</script>

<fieldset class="group-block">
  <legend>Ours</legend>
  <label class="input-group">
    <span class="input-title">Current HP percentage</span>
    <input type="text" bind:value={$hpPct} min="0" max="100">
  </label>
  <div class="input-group">
    <BuffChooser bind:value={$buff} />
  </div>
  <div class="input-group">
    <DebuffChooser bind:value={$debuff} />
  </div>
  <label class="input-group">
    <div class="input-title">Recast reduction</div>
    <input type="text" bind:value={$recastReduction}>
    <p class="help">
      A list of number separated by comma. Each number represents the reduction of each turn e.g. `1,0,0,1` for Shrine Akisa.
    </p>
  </label>
  <BonusList bind:value={$bonusList} />
</fieldset>

<fieldset class="group-block">
  <legend>Enemies</legend>
  <div class="input-group">
    <DebuffChooser bind:value={$targetDebuff} title="Target debuff" />
  </div>
  <label class="input-group">
    <div class="input-title">Target HP</div>
    <input type="number" bind:value={$target.hp}>
    <p class="help">
      When targeting sinister bosses, this value should be the actual HP * 1/20.
    </p>
  </label>
  <label class="input-group">
    <span class="input-title">Target HP percentage</span>
    <input type="text" bind:value={$targetHpPct} min="0" max="100">
  </label>
  <label class="input-group">
    <div class="input-title">Target DEF</div>
    <input type="number" bind:value={$target.def}>
  </label>
  <label>
    <div class="input-title">Target element</div>
    <select bind:value={$target.element}>
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
  <label class="input-group">
    <div class="input-title">Number of targets</div>
    <input type="number" bind:value={$targetNumber}>
  </label>
  <label class="input-group">
    <div class="input-title">Element of BF extra damage</div>
    <select bind:value={$extraDamageElement}>
      <option value="none">None</option>
      <option value="fire">Fire</option>
      <option value="lightning">Lightning</option>
      <option value="water">Water</option>
      <option value="dark">Dark</option>
      <option value="light">Light</option>
    </select>
  </label>
</fieldset>

<fieldset class="group-block">
  <legend>System</legend>
  <label class="input-group">
    <div class="input-title">Turns</div>
    <input type="number" bind:value={$turn}>
  </label>
  <label class="input-group">
    <input type="checkbox" bind:checked={$ignoreElement}>
    Use sub element orbs
  </label>
  <label class="input-group">
    <input type="checkbox" bind:checked={$useSubGroup}>
    Use subdress group
  </label>
  <div class="input-group">
    <div class="radio-title">Orb rarity</div>
    <label>
      <input type="radio" bind:group={$orbRarity} value="sr">
      SR
    </label>
    <label>
      <input type="radio" bind:group={$orbRarity} value="ur">
      UR
    </label>
  </div>
  <label class="input-group">
    <input type="checkbox" bind:checked={$useCut}>
    Calculate cut damage
  </label>
  <label class="input-group">
    <span class="input-title">Endless mode. <a href="https://github.com/eight04/mgcm-skill-data/issues/31">Learn more</a></span>
    <select bind:value={$endlessMode}>
      <option value="none">None</option>
      <option value="s3">Season 3</option>
      <option value="s4">Season 4</option>
    </select>
  </label>
  <label class="input-group">
    <span class="input-title">Custom skill order. <a href="https://github.com/eight04/mgcm-skill-data/issues/55">Learn more</a></span>
    <textarea bind:value={$customSkillOrder}></textarea>
  </label>
</fieldset>

<div class="actions">
  <button on:click={simulate} disabled={running}>Simulate</button>
  {#if running}
  Calculating...
  {/if}
</div>

{#if result}
  {#if resultErr}
    <div class="result-err">
      {String(result)}
    </div>
  {:else}
    <label class="input-group">
      <span class="input-title">Filter</span>
      <input type="text" bind:value={filter}>
    </label>
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
          {#if matchFilter(row, filter)}
            <tr>
              <td rowspan="5">{i + 1}</td>
              <td rowspan="5">{row.score.toFixed(2)}</td>
              <td rowspan="5">{(row.score * 100 / maxScore).toFixed(2)}</td>
              <td rowspan="5">
                <DressLink dress={row.mainDress.dress}></DressLink>
                <div class="rotation">
                  {row.historyHash}
                </div>
              </td>
              <td rowspan="5">{row.mainDress.orb.name}</td>
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
            <tr>
              <td colspan="2">
                <button on:click={()=>openSubs(row.mainDress.dress.name, row.mod)}>
                  Simulate Subs
                </button>
                <button on:click={()=>addCustomSkillOrder(row.mainDress.dress.name, row.historyHash)}>
                  Specify Skill Order
                </button>
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  {/if}
{:else}
  <p>
    Damage is calculated with following rules:
  </p>

  <ul>
    <li>All skill bombinations are tested.</li>
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
.input-group :global(.radio-title),
:global(.input-title),
:global(.input-sub),
:global(.input-main) {
  margin: .3em 0;
  display: block;
}
.group-block,
:global(.input-group),
.actions {
  margin: .6em 0;
  display: block;
}
.input-group :global(label) {
  display: inline-block;
  margin-right: .6em;
}
li {
  margin-top: .3em;
  margin-bottom: .3em;
}
input[type=number], input[type=text], select {
  display: block;
  width: 100%;
  box-sizing: border-box;
}
.help {
  color: grey;
  margin: 0.3em 0;
  font-size: 0.9em;
}
textarea {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 6em;
  margin: .3em 0;
}
</style>