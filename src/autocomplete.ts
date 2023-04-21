type Unsubscribe = () => void;
type Subscriber<TOption> = (state: AutocompleteState<TOption>) => void;

export type AutocompleteState<TOption> = {
  query: string;
  selected: TOption | null;
  highlighted: TOption | null;
  options: TOption[];
  opened: boolean;
};

type Model<TItem> = State<TItem> & {
  allItems: TItem[];
};

type State<TItem> =
  | {
      type: "unselected & blurred";
    }
  | {
      type: "unselected & focused & opened";
      query: string;
    }
  | {
      type: "unselected & focused & opened & highlighted";
      query: string;
      highlightIndex: number;
    }
  | {
      type: "unselected & focused & closed";
      query: string;
    }
  | {
      type: "selected & blurred";
      selected: TItem;
    }
  | {
      type: "selected & focused & closed";
      query: string;
      selected: TItem;
    }
  | {
      type: "selected & focused & opened";
      selected: TItem;
      query: string;
    }
  | {
      type: "selected & focused & opened & highlighted";
      selected: TItem;
      query: string;
      highlightIndex: number;
    };

type Event<TItem> =
  | {
      type: "pressed-arrow-key";
      key: "arrow-up" | "arrow-down";
    }
  | {
      type: "pressed-escape-key";
    }
  | {
      type: "pressed-enter-key";
    }
  | {
      type: "clicked-item";
      item: TItem;
    }
  | {
      type: "focused-input";
    }
  | {
      type: "blurred-input";
    }
  | {
      type: "inputted-query";
      query: string;
    };

export const reducer = <TItem>({
  toQuery,
  toKey,
  model,
  event,
}: {
  toKey: (item: TItem) => string;
  toQuery: (item: TItem) => string;
  model: Model<TItem>;
  event: Event<TItem>;
}): Model<TItem> => {
  switch (model.type) {
    case "selected & blurred": {
      switch (event.type) {
        case "focused-input": {
          return {
            ...model,
            type: "selected & focused & opened",
            query: toQuery(model.selected),
            selected: model.selected,
          };
        }
        default: {
          return model;
        }
      }
    }

    case "selected & focused & closed": {
      return model;
    }

    case "selected & focused & opened": {
      switch (event.type) {
        case "blurred-input": {
          return {
            ...model,
            type: "selected & blurred",
            selected: model.selected,
          };
        }

        case "clicked-item": {
          return {
            ...model,
            type: "selected & focused & closed",
            query: model.query,
            selected: event.item,
          };
        }

        case "pressed-arrow-key": {
          const filtered = toFilteredItems({
            model,
            toQuery,
          });

          const selectedIndex = filtered.findIndex(
            (item) => toKey(item) === toKey(item)
          );

          if (selectedIndex === -1) {
            return {
              ...model,
              highlightIndex: 0,
              type: "selected & focused & opened & highlighted",
            };
          }

          const delta = event.key === "arrow-down" ? 1 : -1;

          const highlightIndex = circularIndex(
            selectedIndex + delta,
            filtered.length
          );

          return {
            ...model,
            highlightIndex,
            type: "selected & focused & opened & highlighted",
          };
        }

        case "pressed-escape-key": {
          return { ...model, type: "selected & focused & closed" };
        }

        default: {
          return model;
        }
      }
    }

    case "selected & focused & opened & highlighted": {
      switch (event.type) {
        case "blurred-input": {
          return { ...model, type: "selected & blurred" };
        }

        case "clicked-item": {
          return {
            ...model,
            type: "selected & focused & closed",
            selected: event.item,
          };
        }

        case "inputted-query": {
          return { ...model, query: event.query };
        }

        case "pressed-arrow-key": {
          const filtered = toFilteredItems({
            model,
            toQuery,
          });
          const delta = event.key === "arrow-down" ? 1 : -1;
          const highlightIndex = circularIndex(
            model.highlightIndex + delta,
            filtered.length
          );
          return { ...model, highlightIndex };
        }

        case "pressed-enter-key": {
          const filtered = toFilteredItems({
            model,
            toQuery,
          });

          const selectedNew = filtered[model.highlightIndex];

          if (!selectedNew) {
            return { ...model, type: "selected & focused & closed" };
          }

          return {
            ...model,
            selected: selectedNew,
            type: "selected & focused & closed",
          };
        }

        case "pressed-escape-key": {
          return { ...model, type: "selected & focused & closed" };
        }

        default: {
          return model;
        }
      }
    }

    case "unselected & blurred": {
      switch (event.type) {
        case "focused-input": {
          return { ...model, type: "unselected & focused & opened", query: "" };
        }
        default: {
          return model;
        }
      }
    }

    case "unselected & focused & closed": {
      switch (event.type) {
        case "blurred-input": {
          return { ...model, type: "unselected & blurred" };
        }
        case "inputted-query": {
          return {
            ...model,
            type: "unselected & focused & opened",
            query: event.query,
          };
        }

        case "pressed-arrow-key": {
          return { ...model, type: "unselected & focused & opened" };
        }

        default: {
          return model;
        }
      }
    }

    case "unselected & focused & opened": {
      switch (event.type) {
        case "blurred-input": {
          return { ...model, type: "unselected & blurred" };
        }

        case "clicked-item": {
          return {
            ...model,
            type: "selected & focused & closed",
            selected: event.item,
          };
        }

        case "inputted-query": {
          return { ...model, query: event.query };
        }

        case "pressed-arrow-key": {
          const filtered = toFilteredItems({
            model,
            toQuery,
          });
          const highlightIndex =
            event.key === "arrow-up" ? filtered.length - 1 : 0;

          return {
            ...model,
            type: "unselected & focused & opened & highlighted",
            highlightIndex,
          };
        }

        case "pressed-escape-key": {
          return { ...model, type: "unselected & focused & closed" };
        }

        default: {
          return model;
        }
      }
    }

    case "unselected & focused & opened & highlighted": {
      switch (event.type) {
        case "blurred-input": {
          return { ...model, type: "unselected & blurred" };
        }

        case "clicked-item": {
          return {
            ...model,
            type: "selected & focused & closed",
            selected: event.item,
          };
        }

        case "inputted-query": {
          return {
            ...model,
            type: "unselected & focused & opened",
            query: event.query,
          };
        }

        case "pressed-arrow-key": {
          const filtered = toFilteredItems({ model, toQuery });
          const delta = event.key === "arrow-down" ? 1 : -1;
          const highlightIndex = circularIndex(
            model.highlightIndex + delta,
            filtered.length
          );
          return {
            ...model,
            highlightIndex,
          };
        }

        case "pressed-enter-key": {
          const filtered = toFilteredItems({
            model,
            toQuery,
          });

          const selectedNew = filtered[model.highlightIndex];

          if (!selectedNew) {
            return { ...model, type: "unselected & focused & closed" };
          }

          return {
            ...model,
            selected: selectedNew,
            type: "selected & focused & closed",
          };
        }

        case "pressed-escape-key": {
          return {
            ...model,
            type: "unselected & focused & closed",
          };
        }
      }
      return model;
    }

    default: {
      const exhaustive: never = model;
      return exhaustive;
    }
  }
};

const circularIndex = (index: number, length: number) => {
  if (length === 0) {
    return 0;
  }
  return ((index % length) + length) % length;
};

const toFilteredItems = <TItem>({
  model,
  toQuery,
}: {
  toQuery: (item: TItem) => string;
  model: Model<TItem> & { query: string };
}): TItem[] => {
  return model.allItems.filter((item) => {
    const itemQuery = toQuery(item);
    return itemQuery.includes(model.query);
  });
};

export const createAutocomplete = <TItem>({
  inputElement,
  debug = false,
  toQuery,
  toKey,
}: {
  toQuery: (option: TItem) => string;
  toKey: (option: TItem) => string;
  inputElement: HTMLInputElement;
  debug?: boolean;
}) => {
  const log = (...args: any[]) => {
    if (debug) {
      console.log(...args);
    }
  };

  //
  //
  // State
  //
  //

  let state: AutocompleteState<TItem> = {
    highlighted: null,
    options: [],
    query: "",
    selected: null,
    opened: false,
  };
  const subscribers = new Map<string, Subscriber<TItem>>();

  const getState = () => {
    return state;
  };

  const setState = (
    updater: (stateNew: AutocompleteState<TItem>) => AutocompleteState<TItem>
  ) => {
    state = updater(state);

    for (const subscriber of subscribers.values()) {
      subscriber(state);
    }
  };

  // const dispatch = (event: Event<TItem>) => {};

  const subscribe = (subscriber: Subscriber<TItem>): Unsubscribe => {
    const subscriberId = randomId();
    subscribers.set(subscriberId, subscriber);
    return () => {
      subscribers.delete(subscriberId);
    };
  };

  //
  //
  //
  //
  //

  inputElement.onfocus = () => {
    log("focus");

    setState((state) => ({
      ...state,
      opened: true,
    }));
    return;
  };

  inputElement.onblur = () => {
    log("blur");
    setState((state) => ({
      ...state,
      opened: false,
      highlighted: null,
      query: state.selected ? toQuery(state.selected) : "",
    }));
    return;
  };

  inputElement.onkeydown = (event) => {
    log("keydown", event.key);
    setState((state) => ({
      ...state,
    }));
  };

  return {
    subscribe,
    setState,
    getState,
  };
};

//
//
//
//
//

const randomId = (): string => {
  return String(Math.floor(Math.random() * 1_000_000_000));
};
