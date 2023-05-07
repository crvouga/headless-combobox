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

  let items: { [itemId: string]: HTMLElement } = {};
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

  let model = Combobox.init({ allItems: fruits });

  /*

  Step 3: Write some glue code

  */

  const dispatch = (msg: Combobox.Msg<Item> | null) => {
    if (!msg) {
      return;
    }

    const output = Combobox.update(config, { msg, model });

    console.log(model.type, msg.type, output.model);

    model = output.model;

    Combobox.runEffects(output, {
      focusInput: () => {
        input?.focus();
      },
      focusSelectedItem: () => {},
      scrollItemIntoView: (item) => {
        items[item.id]?.scrollIntoView({ block: "nearest" });
      },
    });
  };

  /*

  Step 3: Wire up to the UI

  */

  $: state = Combobox.toState(config, model);
</script>

<div class="container">
  <label
    class="label"
    {...state.aria.inputLabel}
    for={state.aria.inputLabel.for}
  >
    Fruit Single Select
  </label>
  <p {...state.aria.helperText}>{Combobox.ariaContentDefaults.helperText}</p>

  <button on:click={() => dispatch({ type: "pressed-unselect-all-button" })}>
    Clear
  </button>

  <div class="input-container">
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
      on:focus={() => dispatch({ type: "focused-input" })}
      on:blur={() => dispatch({ type: "blurred-input" })}
      on:click={() => dispatch({ type: "pressed-input" })}
      on:keydown={(event) => dispatch(Combobox.keyToMsg(event.key))}
    />
    <ul
      {...state.aria.itemList}
      class="suggestions"
      class:hide={!state.isOpened}
    >
      {#if state.items.length === 0}
        <li>No results</li>
      {/if}
      {#each state.items as item, index}
        <li
          {...state.aria.item(item)}
          bind:this={items[item.id]}
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
  </div>
</div>

<style>
  .container {
    width: 100%;
    max-width: 300px;
  }

  .input-container {
    position: relative;
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
    font-size: large;
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
    font-size: large;
  }

  @media (prefers-color-scheme: dark) {
    .suggestions {
      background: #121212;
    }
  }

  @media (prefers-color-scheme: dark) {
    .highlighted {
      background-color: #eee;
      color: black;
    }
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
    background-color: #333;
    color: white;
  }
  .selected {
    background-color: blue;
    color: #fff;
  }
  .selected-and-highlighted {
    background-color: lightblue;
  }
</style>
