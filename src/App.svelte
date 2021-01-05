<script>
import DressChooser from "./DressChooser.svelte";
import SubdressSimulator from "./SubdressSimulator.svelte";
import DPSSimulator from "./DPSSimulator.svelte";

import {language} from "./i18n.mjs";

let subSim;
let subSimEl;

function openSub(e) {
  subSim.setCustomMod(e.detail);
  subSimEl.open = true;
  subSimEl.scrollIntoView({behavior: "smooth"});
}
</script>

<h1>MGCM Skill Data</h1>

<label>
  Language
  <select bind:value={$language}>
    <option value="en">EN</option>
    <option value="jp">JP</option>
    <option value="tw">TW</option>
  </select>
</label>

<details>
  <summary>Wardrobe</summary>
  <DressChooser />
</details>

<details bind:this={subSimEl}>
  <summary>Subdress Simulator</summary>
  <SubdressSimulator bind:this={subSim} />
</details>

<details>
  <summary>Damage Simulator</summary>
  <DPSSimulator on:openSub={openSub} />
</details>

<footer>
  <a href="https://github.com/eight04/mgcm-skill-data">eight04/mgcm-skill-data</a>
</footer>

<style>
:global(body) {
  font-size: 16px;
  font-family: sans-serif;
  margin: 2em;
}
:global(input), :global(button), :global(select) {
  font-size: .95em;
  font-family: inherit;
  padding: .3em .6em;
}
details {
  border: 2px solid silver;
  padding: .6em;
  margin: .2em 0;
}
summary {
  padding: .6em;
  cursor: pointer;
}
footer {
  text-align: right;
  margin: 1.2em;
}
</style>