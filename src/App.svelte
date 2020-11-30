<script>
import {getStore} from "./store.mjs";
import allDresses from "./i18n-all-dresses.yml";
import {_d} from "./i18n.mjs";

let includedDresses = getStore("includedDresses", []);

$: console.log($includedDresses);
</script>

<h1>MGCM Simulator</h1>

<label for="includedDresses">Included dresses</label>
<select id="includedDresses" multiple bind:value={$includedDresses}>
  {#each allDresses as dress}
    <option value={dress.jp}>{_d(dress)}</option>
  {/each}
</select>
