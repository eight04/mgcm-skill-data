<script>
export let buff = [];
</script>

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
  <label>
    <input type="checkbox" bind:group={buff} value="crit">
    Crit
  </label>
</div>
