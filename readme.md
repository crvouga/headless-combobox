# headless-combobox

![demo](https://github.com/crvouga/headless-combobox/raw/main/demo.gif)

## ⚠️ WORK IN PROGRESS

I'm comfortable using this in my projects but use at your own risk!

The public API may be unstable.

Let me know if you find any issues.

## Pros

- 🧠 Headless. Bring your own styles.
- 🔌 Framework agnostic. Bring your own framework.
- ⚡️ Zero dependencies
- ♿️ [WAI ARIA Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) support
- 🧺 Multi Select supported
- 🥚 Select Only supported
- 💪 Written in TypeScript
- 🌳 Simple pure functional [Elm](https://elm-lang.org/)-like API
- 💼 Works anywhere JavaScript works.
  - React Native
  - Vanilla JS & HTML
  - Vue
  - Node.js
  - Redux (Since the API is just pure functions)
  - Any JS framework

## Cons

- 🧠 Headless. You do have to write your own styles.
- 🔌 Framework agnostic. You do have to write error prone adapter code.
- 🌳 [Elm](https://elm-lang.org/)-like API. People may hate that.
- 📚 Missing good documentation. The only way to learn this library is through the examples.

## Good use cases are

- You need a custom looking combobox
- You're working in a legacy framework
- You're working in a framework with a small ecosystem
- You're working in a framework that always has breaking changes
- You hate learning how to override styles in combobox libraries

## Demos

- [Svelte Demo](https://svelte.headlesscombobox.chrisvouga.dev/)

## Links

- [bundlephobia](https://bundlephobia.com/package/headless-combobox)
- [API Reference](https://headlesscombobox.chrisvouga.dev/)
- [Github](https://github.com/crvouga/headless-combobox)
- [NPM](https://www.npmjs.com/package/headless-combobox)

## Installation

### NPM

```shell
npm install headless-combobox
```

### Yarn

```shell
yarn add headless-combobox
```

### PNPM

```shell
pnpm install headless-combobox
```

## Complementary Libraries

- [match-sorter](https://github.com/kentcdodds/match-sorter) for filtering items
- [floating-ui](https://floating-ui.com/) for rendering the drop down.

## Credit

This library is steals from these libraries:

- [MUI's Autocomplete](https://mui.com/material-ui/react-autocomplete/#multiple-values)
- [Headless UI's Combobox](https://headlessui.com/react/combobox)

## Usage

### Svelte Single Select Example

```svelte
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

  let model = Combobox.init(config, {
    allItems: fruits,
    inputMode: {
      type: "search-mode",
      inputValue: "",
    },
    selectMode: {
      type: "single-select",
    },
  });

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

    Combobox.handleEffects(output, {
      focusInput: () => {
        input?.focus();
      },
      focusSelectedItem: () => {},
      scrollItemIntoView: (item) => {
        items[item.id]?.scrollIntoView({ block: "nearest" });
      },
    });

    // useful for emitting changed events to parent components
    Combobox.handleEvents(output, {
      onInputValueChanged() {
        console.log("onInputValueChanged");
      },
      onSelectedItemsChanged() {
        console.log("onSelectedItemsChanged");
      },
    });
  };

  const onKeydown = (event: KeyboardEvent) => {
    const msg = Combobox.keyToMsg<Item>(event.key);
    if (msg.shouldPreventDefault) {
      event.preventDefault();
    }
    dispatch(msg);
  };

  /*


  Step 4: Wire up to the UI

  ⚠️ This is the error prone part

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
      on:mousedown={() => dispatch({ type: "pressed-input" })}
      on:keydown={onKeydown}
    />
    <ul
      {...state.aria.itemList}
      class="suggestions"
      class:hide={!state.isOpened}
    >
      {#if state.renderItems.length === 0}
        <li>No results</li>
      {/if}
      {#each state.renderItems as item, index}
        <li
          {...item.aria}
          bind:this={items[item.item.id]}
          on:mousemove={() => dispatch({ type: "hovered-over-item", index })}
          on:mousedown|preventDefault={() =>
            /* Make sure it's a mousedown event instead of click event */
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

<!--


  We get to use our own styles 🎉


 -->
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
    max-height: 300px;
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

```
