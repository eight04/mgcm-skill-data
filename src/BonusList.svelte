<script>
export let title = "Other bonuses";
export let value = [];

function addNewBonus() {
  value.push({
    type: "atk%",
    value: 0,
    element: null
  });
  value = value;
}

function deleteBonus(bonus) {
  const i = value.indexOf(bonus);
  if (i < 0) {
    throw new Error(`can't find bonus: ${bonus}`);
  }
  value.splice(i, 1);
  value = value;
}

</script>

<div class="input-gruop">
  <div class="input-title">{title}</div>
  <div class="input-main data-table">
    <div class="data-table-cell">Type</div>
    <div class="data-table-cell">Value</div>
    <div class="data-table-cell">Element</div>
    <div></div>
    
    {#each value as bonus}
      <select bind:value={bonus.type}>
        <option value="hp%">HP%</option>
        <!-- <option value="hp">HP+</option> -->
        <option value="atk%">ATK%</option>
        <option value="atk">ATK+</option>
        <option value="def%">DEF%</option>
        <option value="def">DEF+</option>
        <option value="fcs">FCS+</option>
        <option value="rst">RST+</option>
        <option value="spd">SPD+</option>
        <option value="critDamage">Crit DMG</option>
        <option value="critRate">Crit Rate</option>
      </select>
      <input type="number" bind:value={bonus.value}>
      <select bind:value={bonus.element}>
        <option value="fire">Fire</option>
        <option value="lightning">Lightning</option>
        <option value="water">Water</option>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
        <option value={null}>All</option>
      </select>
      <button on:click={() => deleteBonus(bonus)}>Delete</button>
    {/each}
  </div>
  <button class="input-sub" on:click={addNewBonus}>Add new bonus</button>
</div>

<style>
.data-table {
  display: inline-grid;
  grid: auto-flow / max-content minmax(0, 1fr) max-content max-content;
}
.data-table-cell {
  padding: 0.3em 0.6em;
}
</style>
