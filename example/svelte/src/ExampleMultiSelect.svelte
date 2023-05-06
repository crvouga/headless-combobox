<script lang="ts">
  import * as Combobox from "./src";

  /*

  Step 0: Have some data to display

  */

  type Item = { id: number; label: string };
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

  Step 1: Init the config

  */

  const config = Combobox.initConfig<Item>({
    toItemId: (item) => item.id,
    toItemInputValue: (item) => item.label,
  });

  /*

  Step 2: Init the state

  */

  let model = Combobox.init({
    allItems: fruits,
    mode: { type: "multi-select" },
  });

  /*

  Step 3: Write some glue code

  */

  const dispatch = (msg: Combobox.Msg<Item> | null) => {
    if (!msg) {
      return;
    }

    const output = Combobox.update(config, { msg, model });

    model = output.model;
    console.log(msg.type, model);

    for (const effect of output.effects) {
      if (effect.type === "scroll-item-into-view") {
        const li = listItems[effect.item.id];
        if (!li) {
          continue;
        }
        li.scrollIntoView({ block: "nearest" });
      }
    }
  };

  /*

  Step 3: Wire up to the UI

  */

  $: state = Combobox.toState(config, model);
</script>

<p>Selections</p>
<div class="chip-list">
  {#each state.selections as selection}
    <span class="chip">
      {selection.label}
    </span>
  {/each}
</div>

<label class="label" {...state.aria.inputLabel}>
  <p {...state.aria.helperText}>Use arrow keys to navigate the list</p>
  Multi Select Fruits
  <input
    {...state.aria.input}
    class="input"
    value={state.inputValue}
    on:input={(event) =>
      dispatch({
        type: "inputted-value",
        inputValue: event.currentTarget.value,
      })}
    on:click={() => dispatch({ type: "pressed-input" })}
    on:focus={() => dispatch({ type: "focused-input" })}
    on:blur={() => dispatch({ type: "blurred-input" })}
    on:keydown={(event) =>
      dispatch(Combobox.browserKeyboardEventKeyToMsg(event.key))}
  />
  <ul {...state.aria.itemList} class="suggestions" class:hide={!state.isOpened}>
    {#each state.items as item, index}
      <li
        {...state.aria.item(item)}
        bind:this={listItems[item.id]}
        on:mousemove={() => dispatch({ type: "hovered-over-item", index })}
        on:mousedown|preventDefault={() =>
          dispatch({ type: "pressed-item", item })}
        on:focus={() => dispatch({ type: "hovered-over-item", index })}
        class="option"
        class:highlighted={state.itemStatus(item) === "highlighted"}
        class:selected={state.itemStatus(item) === "selected"}
        class:selected-and-highlighted={state.itemStatus(item) ===
          "selected-and-highlighted"}
      >
        {config.toItemInputValue(item)}
      </li>
    {/each}
  </ul>
</label>

<style>
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
    max-height: 200px;
    overflow: scroll;
    border: 1px solid #ccc;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
    background: #121212;
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

  .chip-list {
    display: flex;
    height: 4rem;
  }
  .chip {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    margin: 0.5rem;
    background: #121212;
    border-radius: 0.5rem;
    height: 1.5rem;
  }
</style>
