import {
  browserKeyboardEventKeyToMsg,
  init,
  initConfig,
  toState,
  update,
  type Config,
  type Model,
  type Msg,
} from "./core";

type State<T> = ReturnType<typeof toState<T>>;

/**
 * @group Observable
 * @description
 * This is a helper function that returns an object that can be glued into your app with less boilerplate.
 */
export const createObservable = <T>({
  allItems,
  toItemId,
  toItemInputValue,
  onScroll,
  namespace,
  deterministicFilter,
}: {
  allItems: T[];
  toItemId: (item: T) => string | number;
  toItemInputValue: (item: T) => string;
  onScroll: (item: T, config: Config<T>) => void;
  namespace?: string;
  deterministicFilter?: (model: Model<T>) => T[];
}) => {
  const config = initConfig({
    toItemId,
    toItemInputValue,
    namespace,
    deterministicFilter,
  });

  const subscribers = new Map<string, (state: State<T>) => void>();

  let model = init({
    allItems,
  });

  const setModel = (newModel: Model<T>) => {
    model = newModel;
    for (const subscriber of subscribers.values()) {
      subscriber(toState(config, model));
    }
  };

  const getState = () => {
    return toState(config, model);
  };

  const dispatch = (msg: Msg<T>) => {
    const output = update(config, { model, msg });
    setModel(output.model);
    for (const effect of output.effects) {
      if (effect.type === "scroll-item-into-view") {
        onScroll(effect.item, config);
      }
    }
  };

  const subscribe = (subscriber: (state: State<T>) => void) => {
    const id = Math.random().toString(36).substring(2, 9);
    subscribers.set(id, subscriber);
    return () => {
      subscribers.delete(id);
    };
  };

  const events = {
    onInput: (inputValue: string) =>
      dispatch({ type: "inputted-value", inputValue }),
    onInputKeyDown: (key: string) => {
      const msg = browserKeyboardEventKeyToMsg<T>(key);
      if (msg) {
        dispatch(msg);
      }
    },
    onInputBlur: () => dispatch({ type: "blurred-input" }),
    onInputFocus: () => dispatch({ type: "focused-input" }),
    onInputPress: () => dispatch({ type: "pressed-input" }),
    //
    onItemPress: (item: T) => dispatch({ type: "pressed-item", item }),
    onItemFocus: (index: number) =>
      dispatch({ type: "hovered-over-item", index }),
    onItemHover: (index: number) =>
      dispatch({ type: "hovered-over-item", index }),
  };

  const setAllItems = (allItems: T[]) => {
    setModel({
      ...model,
      allItems,
    });
  };

  return {
    ...config,
    ...events,
    setAllItems,
    getState,
    dispatch,
    subscribe,
  };
};
