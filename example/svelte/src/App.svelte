<script lang="ts">
  import Example from "./Example.svelte";
  import ExampleMultiSelect from "./ExampleMultiSelect.svelte";
</script>

<main>
  <ExampleMultiSelect />
  <Example />
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
