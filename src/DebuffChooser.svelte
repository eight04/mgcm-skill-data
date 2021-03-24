<script>
export let title = "Debuff";
export let value = [];

let checks = value.filter(i => i !== "cut");
let cuts = value.filter(i => i == "cut").length;

$: value = [...checks, ...Array(cuts).fill("cut")];
</script>

<div class="radio-group">
  <div class="radio-title">{title}</div>
  <label>
    <input type="checkbox" bind:group={checks} value="atk">
    ATK
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="def">
    DEF
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="spd">
    SPD
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="fcs">
    FCS
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="rst">
    RST
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="taunt">
    Taunt
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="noRecovery">
    No recovery
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="noBuff">
    No buff
  </label>
  <label>
    Cut
    <input type="number" bind:value={cuts} class="input-inline" />
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="sleep">
    Sleep
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="stun">
    Stun
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="oblivion">
    Oblivion
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="miss">
    Miss rate
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="silence">
    Silence
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="burn">
    Burn
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="shock">
    Shock
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="freeze">
    Freeze
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="seal">
    Seal
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="confusion">
    Confusion
  </label>
  <label>
    <input type="checkbox" bind:group={checks} value="poison">
    Poison
  </label>
</div>
