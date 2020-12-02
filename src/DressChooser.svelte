<script>
import allDressInfo from "../dress-db.yml";

import {getStore} from "./store.mjs";
import {_d} from "./i18n.mjs";

const includedDresses = getStore("includedDresses", []);
const maxLvDresses = getStore("maxLVDresses", []);

let selectedAllDresses = [];
let selectedMyDresses = [];
let selected60Dresses = [];
let selected80Dresses = [];

function addMyDress() {
  $includedDresses = allDressInfo
    .filter(d =>
      $includedDresses.includes(d.name) || selectedAllDresses.includes(d.name))
    .map(d => d.name);
  selectedMyDresses = selectedAllDresses;
  selectedAllDresses = [];
}

function deleteMyDress() {
  $includedDresses = allDressInfo
    .filter(d =>
      $includedDresses.includes(d.name) && !selectedMyDresses.includes(d.name))
    .map(d => d.name);
  selectedAllDresses = selectedMyDresses;
  selectedMyDresses = [];
}

function add80Dress() {
  $maxLvDresses = allDressInfo
    .filter(d =>
      $maxLvDresses.includes(d.name) || selected60Dresses.includes(d.name))
    .map(d => d.name);
  selected80Dresses = selected60Dresses;
  selected60Dresses = [];
}

function delete80Dress() {
  $maxLvDresses = allDressInfo
    .filter(d =>
      $maxLvDresses.includes(d.name) && !selected80Dresses.includes(d.name))
    .map(d => d.name);
  selected60Dresses = selected80Dresses;
  selected80Dresses = [];
}

function select60Dress(test) {
  selected60Dresses = allDressInfo
    .filter(d =>
      $includedDresses.includes(d.name) &&
      !$maxLvDresses.includes(d.name) &&
      test(d)
    )
    .map(d => d.name);
}
</script>

<div class="container">
  <label for="wardrobeAllDresses" class="l1">All Dresses</label>
  <select id="wardrobeAllDresses" multiple bind:value={selectedAllDresses} class="b1">
    {#each allDressInfo as dress}
      {#if !$includedDresses.includes(dress.name)}
        <option value={dress.name}>{$_d(dress.name)}</option>
      {/if}
    {/each}
  </select>
  
  <div class="actions a1">
    <button on:click={addMyDress}>&rarr;</button>
    <button on:click={deleteMyDress}>&larr;</button>
  </div>
  
  <label for="wardrobeMyDresses" class="l2">My Dresses</label>
  <select id="wardrobeMyDresses" multiple bind:value={selectedMyDresses} class="b2">
    {#each allDressInfo as dress}
      {#if $includedDresses.includes(dress.name)}
        <option value={dress.name}>{$_d(dress.name)}</option>
      {/if}
    {/each}
  </select>
  
  <label for="lv60Dresses" class="l3">Lv.60 Dresses</label>
  <div class="b3 lv60Dresses-container">
    <select id="lv60Dresses" multiple bind:value={selected60Dresses}>
      {#each allDressInfo as dress}
        {#if $includedDresses.includes(dress.name) && !$maxLvDresses.includes(dress.name)}
          <option value={dress.name}>{$_d(dress.name)}</option>
        {/if}
      {/each}
    </select>
    <div class="select-actions">
      <button on:click={
        () => select60Dress(d => d.rarity === "N" || d.rarity === "R")
      }>
        Select All N/R dresses
      </button>
      <button on:click={
        () => select60Dress(d => d.pool === "event")
      }>
        Select All event dresses
      </button>
    </div>
  </div>
  
  <div class="actions a2">
    <button on:click={add80Dress}>&rarr;</button>
    <button on:click={delete80Dress}>&larr;</button>
  </div>
  
  <label for="lv80Dresses" class="l4">Lv.80 Dresses</label>
  <select id="lv80Dresses" multiple bind:value={selected80Dresses} class="b4">
    {#each allDressInfo as dress}
      {#if $includedDresses.includes(dress.name) && $maxLvDresses.includes(dress.name)}
        <option value={dress.name}>{$_d(dress.name)}</option>
      {/if}
    {/each}
  </select>
</div>

<style>
.container {
  display: grid;
  grid-template:
    "l1 .  l2" auto
    "b1 a1 b2" 60vh
    "l3 .  l4" auto
    "b3 a2 b4" 60vh / 1fr auto 1fr;
  gap: .6em;
}
.l1 {
  grid-area: l1;
}
.l2 {
  grid-area: l2;
}
.l3 {
  grid-area: l3;
}
.l4 {
  grid-area: l4;
}
.a1 {
  grid-area: a1;
}
.a2 {
  grid-area: a2;
}
.b1 {
  grid-area: b1;
}
.b2 {
  grid-area: b2;
}
.b3 {
  grid-area: b3;
}
.b4 {
  grid-area: b4;
}
.select-actions {
  grid-area: as;
}
label {
  margin-top: .6em;
}
select {
  width: 100%;
}
.actions {
  align-self: center;
}
.actions button {
  display: block;
}
.lv60Dresses-container {
  display: flex;
  flex-direction: column;
}
.lv60Dresses-container select {
  flex: 1
}
</style>