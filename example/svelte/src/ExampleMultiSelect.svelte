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
  let input: HTMLInputElement | null = null;

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

  const dispatch = (msg: Combobox.Msg<Item>) => {
    const output = Combobox.update(config, { msg, model });

    model = output.model;

    console.log(msg.type, model);

    Combobox.runEffects(output, {
      scrollItemIntoView: (item) => {
        const li = listItems[item.id];
        if (li) {
          li.scrollIntoView({ block: "nearest" });
        }
      },
    });
  };

  const handleKeyDown = (
    event: KeyboardEvent & {
      currentTarget: EventTarget & HTMLInputElement;
    }
  ) => {
    const msg = Combobox.browserKeyboardEventKeyToMsg<Item>(event.key);
    if (!msg) {
      return;
    }
    if (msg?.shouldPreventDefault) {
      event.preventDefault();
    }
    dispatch(msg);
  };

  /*

  Step 3: Wire up to the UI

  */

  $: state = Combobox.toState(config, model);
</script>

<label class="label" {...state.aria.inputLabel}>
  <p {...state.aria.helperText}>Use arrow keys to navigate the list</p>
  <div class="chip-list">
    {#each state.selections as selectedItem}
      <span
        class="chip"
        class:chip-highlighted={state.isSelectedItemHighlighted(selectedItem)}
      >
        {selectedItem.label}
        <button
          class="chip-delete-btn"
          on:mousedown|preventDefault={() =>
            dispatch({ type: "pressed-unselect-button", item: selectedItem })}
        >
          X
        </button>
      </span>
    {/each}
  </div>

  Multi Select Fruits
  <input
    {...state.aria.input}
    class="input"
    value={state.inputValue}
    bind:this={input}
    on:input={(event) =>
      dispatch({
        type: "inputted-value",
        inputValue: event.currentTarget.value,
      })}
    on:click={() => dispatch({ type: "pressed-input" })}
    on:focus={() => dispatch({ type: "focused-input" })}
    on:blur={() => dispatch({ type: "blurred-input" })}
    on:keydown={handleKeyDown}
  />
  <ul {...state.aria.itemList} class="suggestions" class:hide={!state.isOpened}>
    {#if state.items.length === 0}
      <li>No results</li>
    {/if}
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
    max-width: 300px;
    margin: auto;
  }

  .hide {
    display: none;
  }
  .input {
    width: 100%;

    font-size: large;
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
    background: #efefef;
  }

  @media (prefers-color-scheme: dark) {
    .suggestions {
      background: #121212;
    }
  }

  .option {
    display: block;
    cursor: pointer;
    list-style: none;
    width: 100%;
    font-size: large;
    margin: 0;
    padding: 0;
  }
  .highlighted {
    background-color: #333;
    color: white;
  }
  @media (prefers-color-scheme: dark) {
    .highlighted {
      background-color: #eee;
      color: black;
    }
  }

  .selected {
    background-color: blue;
    color: white;
  }
  .selected-and-highlighted {
    background-color: lightblue;
  }

  .chip-list {
    display: flex;
    flex-direction: row-reverse;
    height: 4rem;
  }
  .chip {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    margin: 0.5rem;
    background: #efefef;
    border-radius: 0.5rem;
    height: 1.5rem;
    cursor: default;
  }

  .chip-highlighted {
    background: #333;
    color: white;
  }

  .child-delete-btn {
    font-family: monospace;
    font-size: xx-small;
    background: transparent;
    border-radius: 100%;
  }

  @media (prefers-color-scheme: dark) {
    .chip {
      background: #121212;
    }
  }
</style>
