<script lang="ts">
  import ExampleMultiSelect from "./ExampleMultiSelect.svelte";
  import ExampleMultiSelectSelectOnly from "./ExampleMultiSelectSelectOnly.svelte";
  import ExampleSingleSelect from "./ExampleSingleSelect.svelte";
  import ExampleSingleSelectSelectOnly from "./ExampleSingleSelectSelectOnly.svelte";
</script>

<main>
  <ExampleSingleSelect />
  <ExampleSingleSelectSelectOnly />
  <ExampleMultiSelect />
  <ExampleMultiSelectSelectOnly />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5rem;
    padding-top: 10rem;
    padding-bottom: 15rem;
  }
</style>
