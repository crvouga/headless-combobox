# headless-autocomplete

## What is this?

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

# Usage

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
