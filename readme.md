# headless-autocomplete

⚡️zero dependency, 🔍 framework agnostic, 💪typescript,🧠 headless autocomplete.

## Installation

### NPM

```shell
npm install crvouga/headless-autocomplete
```

### Yarn

```shell
yarn add crvouga/headless-autocomplete
```

### PNPM

```shell
pnpm install crvouga/headless-autocomplete
```

## Or just copy and paste into your code. 🤷‍♂️

# Usage

## React.js

```ts
type MyItem = {
  id: string;
  name: string;
};

const Autocomplete = () => {
  const [state, setState] = useState<AutocompleteState<MyItem>>();

  const dispatch = (event: AutocompleteEvent<MyItem>) => {
    setState((state) => {
      return Autocomplete.reducer({});
    });
  };

  useEffect(() => {}, []);

  return <input />;
};
```

## Vue

```html
<script lang="ts" setup>
  import Autocomplete from "crvouga/headless-autocomplete";

  const state = ref<Autocomplete.State<MyItem>>({
    type: "",
  });
</script>
<template>
  <input :value="toQuery(state)" @focus="dispatch({type: "focused"})"
  @blur="dispatch({type: "focused"})" />
</template>
```

## Redux

```ts
type MyState = {
  //you state
  autocomplete: Autocomplete.State;
};
```
