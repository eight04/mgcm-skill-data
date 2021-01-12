<script>
export let title = "Buff";
export let value = [];
</script>

<div class="radio-group">
  <div class="radio-title">{title}</div>
  <label>
    <input type="checkbox" bind:group={value} value="atk">
    ATK
  </label>
  <label>
    <input type="checkbox" bind:group={value} value="def">
    DEF
  </label>
  <label>
    <input type="checkbox" bind:group={value} value="spd">
    SPD
  </label>
  <label>
    <input type="checkbox" bind:group={value} value="crit">
    Crit
  </label>
</div>
