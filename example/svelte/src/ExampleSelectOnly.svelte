<script lang="ts">
  import { onMount } from "svelte";
  import { createCombobox } from "./headless-combobox";

  /*

  Step 0: Have some data to display

  */
  const fruits = [
    { id: 0, label: "pear" },
    { id: 1, label: "apple" },
    { id: 2, label: "banana" },
    { id: 3, label: "orange" },
    { id: 4, label: "strawberry" },
    { id: 5, label: "kiwi" },
    { id: 6, label: "mango" },
    { id: 7, label: "pineapple" },
    { id: 8, label: "watermelon" },
    { id: 9, label: "grape" },
  ];

  let listItems: { [itemId: string]: HTMLElement } = {};

  /*

  Step 1: Create an instance

  */
  const combobox = createCombobox({
    namespace: "example-select-only",
    mode: "select-only",
    allItems: fruits,
    toItemId: (item) => item.id,
    toItemInputValue: (item) => item.label,
    onScroll: (item, config) => {
      const li = listItems[config.toItemId(item)];
      if (!li) {
        return;
      }
      li.scrollIntoView({ block: "nearest" });
    },
  });

  /*

  Step 2: Write some glue code

  */
  let state = combobox.getState();
  onMount(() =>
    combobox.subscribe((stateNew) => {
      state = stateNew;
    })
  );

  /*

  Step 3: Wire up to the UI

  */
</script>

<div class="container">
  <p {...state.aria.helperText}>Use arrow keys to navigate the list</p>

  <div
    {...state.aria.input}
    class="input"
    on:focus={combobox.onInputFocus}
    on:blur={combobox.onInputBlur}
    on:keydown={(event) => combobox.onInputKeyDown(event.key)}
  >
    {state.inputValue}
  </div>
  <ul {...state.aria.itemList} class="suggestions" class:hide={!state.isOpened}>
    {#each state.items as item, index}
      <li
        {...state.aria.item(item)}
        bind:this={listItems[combobox.toItemId(item)]}
        on:mouseover={() => combobox.onItemHover(index)}
        on:mousedown|preventDefault={() => combobox.onItemPress(item)}
        on:focus={() => combobox.onItemFocus(index)}
        class="option"
        class:highlighted={state.itemStatus(item) === "highlighted"}
        class:selected={state.itemStatus(item) === "selected"}
        class:selected-and-highlighted={state.itemStatus(item) ===
          "selected-and-highlighted"}
      >
        {combobox.toItemInputValue(item)}
      </li>
    {/each}
  </ul>
</div>

<style>
  .container {
    position: relative;
    display: block;
    width: 100%;
  }
  .label {
    position: relative;
    display: block;
    width: 100%;
  }

  .hide {
    display: none;
  }
  .input {
    width: 100%;
    padding: 0.5rem;
    box-sizing: border-box;
    border: 1px solid #ccc;
  }
  .suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 1;
    width: 100%;
    max-height: 100px;
    overflow: scroll;
    border: 1px solid #ccc;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }
  .option {
    display: block;
    cursor: pointer;
    list-style: none;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  .highlighted {
    background-color: #eee;
    color: black;
  }
  .selected {
    background-color: blue;
  }
  .selected-and-highlighted {
    background-color: lightblue;
  }
</style>
