<script lang="ts">
  import ExampleSingleSelect from "./ExampleSingleSelect.svelte";
  import ExampleMultiSelect from "./ExampleMultiSelect.svelte";
  import ExampleSelectOnly from "./ExampleSelectOnly.svelte";
</script>

<main>
  <ExampleSingleSelect />
  <ExampleSelectOnly />
  <ExampleMultiSelect />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rem;
  }
</style>
