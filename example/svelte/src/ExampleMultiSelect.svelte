<script lang="ts">
  import * as Combobox from "./src";

  /*


  Step 0: Have some data


  */

  type Item = { id: number; label: string };

  const fruits: Item[] = [];
  for (let i = 0; i < 500; i++) {
    fruits.push({ id: i, label: `item ${i}` });
  }

  let selectionRefs: { [itemId: string]: HTMLElement } = {};
  let itemEls: { [itemId: string]: HTMLElement } = {};
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
    selectMode: {
      type: "multi-select",
      selectedItemListDirection: "right-to-left",
    },
  });

  /*


  Step 3: Write some glue code


  */

  const dispatch = (msg: Combobox.Msg<Item>) => {
    const output = Combobox.update(config, { msg, model });

    model = output.model;

    Combobox.handleEffects(output, {
      focusSelectedItem: (selectedItem) => {
        selectionRefs[selectedItem.id]?.focus();
      },
      focusInput: () => {
        input?.focus();
      },
      scrollItemIntoView: (item) => {
        itemEls[item.id]?.scrollIntoView({ block: "nearest" });
      },
    });

    console.log(msg.type, output.model.type, output.model);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const msg = Combobox.keyToMsg<Item>(event.key);
    if (msg.shouldPreventDefault) {
      event.preventDefault();
    }
    dispatch(msg);
  };

  /*


  Step 3: Wire up to the UI


  */

  $: state = Combobox.toState(config, model);
</script>

<div>
  <label
    class="label"
    {...state.aria.inputLabel}
    for={state.aria.inputLabel.for}
  >
    Fruit Multi Select
  </label>

  <div class="input-container" on:keydown={handleKeyDown}>
    <p {...state.aria.helperText}>
      {Combobox.ariaContentDefaults.helperText}
    </p>

    <button on:click={() => dispatch({ type: "pressed-unselect-all-button" })}>
      Clear
    </button>

    <ul
      class="chip-list"
      class:ltr={state.selectedItemDirection === "left-to-right"}
      class:rtl={state.selectedItemDirection === "right-to-left"}
      {...state.aria.selectedList}
    >
      {#each state.renderSelectedItems as selectedItem}
        <li
          {...selectedItem.aria}
          bind:this={selectionRefs[selectedItem.item.id]}
          class="chip"
          class:chip-highlighted={selectedItem.status === "focused"}
          on:mousedown|preventDefault
          on:focus={() =>
            dispatch({
              type: "focused-selected-item",
              item: selectedItem.item,
            })}
          on:blur={() =>
            dispatch({
              type: "blurred-selected-item",
              item: selectedItem.item,
            })}
        >
          {selectedItem.item.label}
          <span
            {...selectedItem.ariaUnselectButton}
            class="chip-delete-btn"
            on:mousedown|preventDefault={() =>
              dispatch({
                type: "pressed-unselect-button",
                item: selectedItem.item,
              })}
          >
            &times;
          </span>
        </li>
      {/each}
    </ul>

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
    />
    <ul
      {...state.aria.itemList}
      class="suggestions"
      class:hide={!state.isOpened}
    >
      {#if state.visibleItems.length === 0}
        <li>No results</li>
      {/if}
      {#each state.renderItems as item, index}
        <li
          {...item.aria}
          bind:this={itemEls[item.item.id]}
          on:mousemove={() => dispatch({ type: "hovered-over-item", index })}
          on:mousedown|preventDefault={() =>
            dispatch({ type: "pressed-item", item: item.item })}
          on:focus={() => dispatch({ type: "hovered-over-item", index })}
          class="option"
          class:highlighted={item.status === "highlighted"}
          class:selected={item.status === "selected"}
          class:selected-and-highlighted={item.status ===
            "selected-and-highlighted"}
        >
          {item.inputValue}
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  .input-container {
    position: relative;
    width: 100%;
    max-width: 300px;
  }

  .label {
    position: relative;
    display: block;
    width: 100%;
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
  }

  .ltr {
    flex-wrap: wrap;
    flex-direction: row;
  }

  .rtl {
    flex-direction: row-reverse;
    flex-wrap: wrap-reverse;
  }

  .chip {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    margin: 0.5rem;
    gap: 0.5rem;
    background: #efefef;
    border-radius: 0.5rem;
    height: 1.5rem;
    cursor: default;
    font-size: large;
    user-select: none;
  }
  .chip-highlighted {
    background: #333;
    color: white;
  }

  .chip-delete-btn {
    font-size: medium;
    background: transparent;
    padding: 4px;
    border-radius: 100%;
    cursor: pointer;
  }

  @media (prefers-color-scheme: dark) {
    .chip {
      background: #121212;
    }
  }
</style>
