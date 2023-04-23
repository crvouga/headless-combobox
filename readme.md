# headless-autocomplete

## Pros

- 🧠 Headless. Bring your own styles.
- 🔌 Framework agnostic. Bring your own framework.
- ⚡️ Zero dependencies
- ♿️ [WAI ARIA Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) support
- 💪 Written in TypeScript
- 🌳 Simple API
- 💼 Works anywhere JavaScript works. React Native, Vue, Node.js, Redux, Any legacy JS framework etc.

## Cons

- 🧠 Headless. You do have to write your own styles.
- 🔌 Framework agnostic. You do have to write glue code.

## Good use cases are

- You need a custom looking autocomplete
- You're working in a legacy framework
- You're working in a framework with a small ecosystem
- You're working in a framework that always has breaking changes
- You like programming in a functional style
- You hate learning how to override styles in autocomplete libraries

## Links

- [React Example](https://headless-autocomplete-example.vercel.app/)
- [Documentation](https://headless-autocomplete.vercel.app/)
- [Github](https://github.com/crvouga/headless-autocomplete)
- [NPM](https://www.npmjs.com/package/headless-autocomplete)

## Installation

### NPM

```shell
npm install headless-autocomplete
```

### Yarn

```shell
yarn add headless-autocomplete
```

### PNPM

```shell
pnpm install headless-autocomplete
```

Or you could just copy & paste it into your source code. It's just one file with zero dependencies.

## TODO

- Multi select

## Complementary Libraries

- [match-sorter](https://github.com/kentcdodds/match-sorter) for filtering items
- [floating-ui](https://floating-ui.com/) for rendering the drop down.

## Usage

### Svelte

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { createAutocomplete } from "headless-autocomplete";

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
  const autocomplete = createAutocomplete({
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
  let state = autocomplete.getState();
  onMount(() =>
    autocomplete.subscribe((stateNew) => {
      state = stateNew;
    })
  );

  /*

  Step 3: Wire up to the UI

  */
</script>

<label class="label" {...state.aria.inputLabel}>
  <p {...state.aria.helperText}>Use arrow keys to navigate the list</p>
  Fruits
  <input
    {...state.aria.input}
    class="input"
    value={state.inputValue}
    on:input={(event) => autocomplete.onInput(event.currentTarget.value)}
    on:focus={autocomplete.onInputFocus}
    on:blur={autocomplete.onInputBlur}
    on:keydown={(event) => autocomplete.onInputKeyDown(event.key)}
  />
  <ul {...state.aria.itemList} class="suggestions" class:hide={!state.isOpened}>
    {#each state.items as item, index}
      <li
        {...state.aria.item(item)}
        bind:this={listItems[autocomplete.toItemId(item)]}
        on:mouseover={() => autocomplete.onItemHover(index)}
        on:mousedown|preventDefault={() => autocomplete.onItemPress(item)}
        on:focus={() => autocomplete.onItemFocus(index)}
        class="option"
        class:highlighted={state.itemStatus(item) === "highlighted"}
        class:selected={state.itemStatus(item) === "selected"}
        class:selected-and-highlighted={state.itemStatus(item) ===
          "selected-and-highlighted"}
      >
        {autocomplete.toItemInputValue(item)}
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
```

### React

```ts
import { useEffect, useRef, useState } from "react";
import { createAutocomplete } from "headless-autocomplete";

/*

Step 0. Have some data to display

*/
type Movie = {
  year: number;
  label: string;
};

function Example() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const refs = useRef(new Map<string | number, HTMLElement>());

  /*

  Step 1. Create the instance

  */
  const autocompleteRef = useRef(
    createAutocomplete<Movie>({
      allItems: top100Films,
      toItemId: (item) => item.label,
      toItemInputValue: (item) => item.label,
      onScroll: (item, config) => {
        const ref = refs.current.get(config.toItemId(item));
        ref?.scrollIntoView({
          block: "nearest",
        });
      },
    })
  );

  /*

  Step 2. Write some glue code

  */
  const [state, setState] = useState(() => autocompleteRef.current.getState());

  useEffect(() => {
    return autocompleteRef.current.subscribe((state) => {
      setState(state);
    });
  }, []);

  /*

  Step 3. Wire up to the UI

  */
  return (
    <div
      style={{
        fontSize: "1.25rem",
        outlineColor: "skyblue",
        fontFamily: "monospace",
        maxWidth: "720px",
        margin: "auto",
        width: "100%",
      }}>
      <div style={{ position: "relative", width: "100%" }}>
        <label {...state.aria.inputLabel}>
          Movies
          <input
            {...state.aria.input}
            style={{
              width: "100%",
              padding: "1rem",
              fontSize: "inherit",
              fontFamily: "inherit",
              maxWidth: "100%",
              margin: 0,
              boxSizing: "border-box",
            }}
            ref={inputRef}
            value={state.inputValue}
            onInput={(event) =>
              autocompleteRef.current.onInput(event.currentTarget.value)
            }
            onBlur={autocompleteRef.current.onInputBlur}
            onFocus={autocompleteRef.current.onInputFocus}
            onClick={autocompleteRef.current.onInputPress}
            onKeyDown={(event) =>
              autocompleteRef.current.onInputKeyDown(event.key)
            }
          />
        </label>

        <ul
          {...state.aria.itemList}
          style={{
            display: state.isOpened ? "block" : "none",
            position: "absolute",
            top: "100%",
            zIndex: 2,
            left: 0,
            padding: 0,
            margin: 0,
            border: "1px solid black",
            maxHeight: "360px",
            overflow: "scroll",
            width: "100%",
            listStyle: "none",
          }}>
          {state.items.map((item, index) => {
            const status = state.itemStatus(item);
            return (
              <li
                {...state.aria.item(item)}
                key={item.label}
                ref={(ref) => {
                  if (ref) {
                    refs.current.set(
                      autocompleteRef.current.toItemId(item),
                      ref
                    );
                  }
                }}
                onMouseDown={(event) => {
                  event.preventDefault(); // prevent input blur
                  autocompleteRef.current.onItemPress(item);
                }}
                onMouseMove={() => autocompleteRef.current.onItemHover(index)}
                onFocus={() => autocompleteRef.current.onItemFocus(index)}
                style={{
                  margin: 0,
                  padding: "0.5rem",
                  cursor: "pointer",
                  ...(status === "selected"
                    ? {
                        background: "lightblue",
                        color: "white",
                      }
                    : status === "highlighted"
                    ? {
                        background: "black",
                        color: "white",
                      }
                    : status === "selected-and-highlighted"
                    ? {
                        background: "blue",
                        color: "white",
                      }
                    : status === "unselected"
                    ? {}
                    : {}),
                }}>
                {item.label} ({item.year})
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// Top 100 films as rated by IMDb users. http://www.imdb.com/chart/top
const top100Films: Movie[] = [
  { label: "The Shawshank Redemption", year: 1994 },
  { label: "The Godfather", year: 1972 },
  { label: "The Godfather: Part II", year: 1974 },
  { label: "The Dark Knight", year: 2008 },
  { label: "12 Angry Men", year: 1957 },
  { label: "Schindler's List", year: 1993 },
  { label: "Pulp Fiction", year: 1994 },
  {
    label: "The Lord of the Rings: The Return of the King",
    year: 2003,
  },
  { label: "The Good, the Bad and the Ugly", year: 1966 },
  { label: "Fight Club", year: 1999 },
  {
    label: "The Lord of the Rings: The Fellowship of the Ring",
    year: 2001,
  },
  {
    label: "Star Wars: Episode V - The Empire Strikes Back",
    year: 1980,
  },
  { label: "Forrest Gump", year: 1994 },
  { label: "Inception", year: 2010 },
  {
    label: "The Lord of the Rings: The Two Towers",
    year: 2002,
  },
  { label: "One Flew Over the Cuckoo's Nest", year: 1975 },
  { label: "Goodfellas", year: 1990 },
  { label: "The Matrix", year: 1999 },
  { label: "Seven Samurai", year: 1954 },
  {
    label: "Star Wars: Episode IV - A New Hope",
    year: 1977,
  },
  { label: "City of God", year: 2002 },
  { label: "Se7en", year: 1995 },
  { label: "The Silence of the Lambs", year: 1991 },
  { label: "It's a Wonderful Life", year: 1946 },
  { label: "Life Is Beautiful", year: 1997 },
  { label: "The Usual Suspects", year: 1995 },
  { label: "Léon: The Professional", year: 1994 },
  { label: "Spirited Away", year: 2001 },
  { label: "Saving Private Ryan", year: 1998 },
  { label: "Once Upon a Time in the West", year: 1968 },
  { label: "American History X", year: 1998 },
  { label: "Interstellar", year: 2014 },
  { label: "Casablanca", year: 1942 },
  { label: "City Lights", year: 1931 },
  { label: "Psycho", year: 1960 },
  { label: "The Green Mile", year: 1999 },
  { label: "The Intouchables", year: 2011 },
  { label: "Modern Times", year: 1936 },
  { label: "Raiders of the Lost Ark", year: 1981 },
  { label: "Rear Window", year: 1954 },
  { label: "The Pianist", year: 2002 },
  { label: "The Departed", year: 2006 },
  { label: "Terminator 2: Judgment Day", year: 1991 },
  { label: "Back to the Future", year: 1985 },
  { label: "Whiplash", year: 2014 },
  { label: "Gladiator", year: 2000 },
  { label: "Memento", year: 2000 },
  { label: "The Prestige", year: 2006 },
  { label: "The Lion King", year: 1994 },
  { label: "Apocalypse Now", year: 1979 },
  { label: "Alien", year: 1979 },
  { label: "Sunset Boulevard", year: 1950 },
  {
    label:
      "Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb",
    year: 1964,
  },
  { label: "The Great Dictator", year: 1940 },
  { label: "Cinema Paradiso", year: 1988 },
  { label: "The Lives of Others", year: 2006 },
  { label: "Grave of the Fireflies", year: 1988 },
  { label: "Paths of Glory", year: 1957 },
  { label: "Django Unchained", year: 2012 },
  { label: "The Shining", year: 1980 },
  { label: "WALL·E", year: 2008 },
  { label: "American Beauty", year: 1999 },
  { label: "The Dark Knight Rises", year: 2012 },
  { label: "Princess Mononoke", year: 1997 },
  { label: "Aliens", year: 1986 },
  { label: "Oldboy", year: 2003 },
  { label: "Once Upon a Time in America", year: 1984 },
  { label: "Witness for the Prosecution", year: 1957 },
  { label: "Das Boot", year: 1981 },
  { label: "Citizen Kane", year: 1941 },
  { label: "North by Northwest", year: 1959 },
  { label: "Vertigo", year: 1958 },
  {
    label: "Star Wars: Episode VI - Return of the Jedi",
    year: 1983,
  },
  { label: "Reservoir Dogs", year: 1992 },
  { label: "Braveheart", year: 1995 },
  { label: "M", year: 1931 },
  { label: "Requiem for a Dream", year: 2000 },
  { label: "Amélie", year: 2001 },
  { label: "A Clockwork Orange", year: 1971 },
  { label: "Like Stars on Earth", year: 2007 },
  { label: "Taxi Driver", year: 1976 },
  { label: "Lawrence of Arabia", year: 1962 },
  { label: "Double Indemnity", year: 1944 },
  {
    label: "Eternal Sunshine of the Spotless Mind",
    year: 2004,
  },
  { label: "Amadeus", year: 1984 },
  { label: "To Kill a Mockingbird", year: 1962 },
  { label: "Toy Story 3", year: 2010 },
  { label: "Logan", year: 2017 },
  { label: "Full Metal Jacket", year: 1987 },
  { label: "Dangal", year: 2016 },
  { label: "The Sting", year: 1973 },
  { label: "2001: A Space Odyssey", year: 1968 },
  { label: "Singin' in the Rain", year: 1952 },
  { label: "Toy Story", year: 1995 },
  { label: "Bicycle Thieves", year: 1948 },
  { label: "The Kid", year: 1921 },
  { label: "Inglourious Basterds", year: 2009 },
  { label: "Snatch", year: 2000 },
  { label: "3 Idiots", year: 2009 },
  { label: "Monty Python and the Holy Grail", year: 1975 },
];

export default Example;
```
