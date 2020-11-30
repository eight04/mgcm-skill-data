<script>
export let dresses;
</script>

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Orb</th>
      <th>Score</th>
    </tr>
  </thead>
  <tbody>
    {#each dresses as dress}
      <tr>
        <td>{dress.dress.name}</td>
        <td>{dress.orb.name}</td>
        <td class="align-right">{dress.score.toFixed(2)}</td>
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