<script>
import DressLink from "./DressLink.svelte";

export let dresses;
export let baseScore;
</script>

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Orb</th>
      <th>Score</th>
      <th>%</th>
    </tr>
  </thead>
  <tbody>
    {#each dresses as dress}
      <tr>
        <td>
          <DressLink dress={dress.dress}></DressLink>
        </td>
        <td>{dress.orb.name}</td>
        <td class="align-right">{dress.score.toFixed(2)}</td>
        <td>{((baseScore ? (dress.score / baseScore) : 1) * 100).toFixed(2)}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
table {
  border-collapse: collapse;
}
th, td {
  padding: 0.3em 0.6em;
  border: 1px solid grey;
}
.align-right {
  text-align: right;
}
</style>