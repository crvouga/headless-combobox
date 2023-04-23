<script lang="ts">
  import * as Autocomplete from "headless-autocomplete";

  const fruits = ['apple', 'banana', 'orange', 'strawberry', 'kiwi', 'mango', 'pineapple', 'watermelon', 'grape', 'pear'];

  const config = Autocomplete.initConfig<string>({
    toItemId: (item) => item,
    toItemInputValue: (item) => item,
  })


  let state = Autocomplete.init({
    allItems: fruits
  })

  const dispatch = (msg: Autocomplete.Msg<string>) => {
    const output = Autocomplete.update(config, {model:state, msg})
    state = output.model

    Autocomplete.debug({
      log: console.log,
      input: {model:state, msg},
      output
    })
  }

  $: aria = Autocomplete.aria(config, state)
</script>

<div class="container">
  <input
    {...aria.input}
    value={Autocomplete.toCurrentInputValue(config, state)}
    on:input={(event) => dispatch({type: 'inputted-value', inputValue: event.currentTarget.value})}
    on:focus={() => dispatch({type: 'focused-input'})}
    on:blur={() => dispatch({type: 'blurred-input'})}
    on:keydown={(event) => {
      const msg = Autocomplete.browserKeyboardEventKeyToMsg(event.key)
      if(msg) {
        dispatch(msg)
      }
    }}
  />
  {#if Autocomplete.isOpened(state) }
    <ul
    class='suggestions'
    {...aria.itemList}>
      {#each state.allItems as item, index}
        <li
         {...aria.item(item)}
         class='option'
         class:highlighted={Autocomplete.toItemStatus(config, state, item) === 'highlighted'}
         class:selected={Autocomplete.toItemStatus(config, state, item) === 'selected'}
         class:selected-highlighted={Autocomplete.toItemStatus(config, state, item) === 'selected-and-highlighted'}
         on:mouseover={() => dispatch({type: "hovered-over-item", index})}
         on:focus={() => {}}
        >
        {item}
      </li>
      {/each}
    </ul>
  {/if}
  </div>

<style>
  .container {
    position: relative
  }
  .suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 1;
    max-height: 200px;
  }
  .option {
    display: block
  }
  .highlighted {
    background-color: #eee;
    color: black;
  }
  .selected {
    background-color: blue
  }
  .selected-highlighted {
    background-color: lightblue
  }
</style>
