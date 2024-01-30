import {
  aria,
  ariaItem,
  ariaSelectedItem,
  ariaUnselectButton,
} from "./combobox-wai-aria";
import type { ItemStore } from "./item-store";

import {
  LRUCache,
  isNonEmpty,
  type NonEmpty,
  circularIndex,
  clampIndex,
  findIndex,
  intersectionLeft,
  keepIf,
  memoize,
  removeFirst,
  yieldReverse,
  yieldUnique,
} from "./utils";

/** @module Config **/

/**
 * @group Config
 *
 * The Config<T> represents the configuration needed for the combobox to work with generic items.
 * @remark
 * ⚠️ All these functions should be deterministic!
 */
export type Config<T> = {
  toItemId: (item: T) => string | number;
  toItemInputValue: (item: T) => string;
  /**
   * @description
   * The deterministicFilter function is used to filter the items in the suggestion dropdown.
   * This must always be deterministic! That means it must always return the same order and same items for the same input.
   */
  deterministicFilter: (model: Model<T>) => Iterable<T>;
  deterministicFilterKeyFn: (model: Model<T>) => string;
  isEmptyItem: (value: T) => boolean;
  namespace: string;
  visibleItemCache: Map<string, T[]>;
  itemStore?: ItemStore<T>;
};

/**
 * @group Config
 */
export const initConfig = <T>({
  namespace,
  isEmptyItem = () => false,
  visibleItemCacheCapacity = 100,

  ...config
}: {
  toItemId: (item: T) => string | number;
  toItemInputValue: (item: T) => string;
  isEmptyItem?: (item: T) => boolean;
  deterministicFilter?: (model: Model<T>) => Iterable<T>;
  deterministicFilterKeyFn?: (model: Model<T>) => string;
  namespace?: string;
  visibleItemCacheCapacity?: number;
}): Config<T> => {
  const deterministicFilter: Config<T>["deterministicFilter"] =
    config.deterministicFilter
      ? config.deterministicFilter
      : (model) => simpleFilter(configFull, model);

  /**
   * TODO Caching is not working properly
   * The cache is not invalidated when the input changes
   *
   *

   */
  const deterministicFilterKeyFn: Config<T>["deterministicFilterKeyFn"] =
    config.deterministicFilterKeyFn
      ? config.deterministicFilterKeyFn
      : (model) => {
          const inputVal =
            model.inputMode.type === "search-mode"
              ? model.inputMode.inputValue
              : "";

          const key = `${model.inputMode.type}-${model.visibleItemLimit}-${model.allItems.length}-${inputVal}`;

          return key;
        };

  const configFull: Config<T> = {
    ...config,
    isEmptyItem,
    visibleItemCache: new LRUCache(visibleItemCacheCapacity),
    namespace: namespace ?? "combobox",
    deterministicFilter,
    deterministicFilterKeyFn,
  };

  return configFull;
};

/**
 * @group Config
 *
 * The simpleFilter function is a default implementation of the deterministicFilter function.
 */
export const simpleFilter = function* <T>(config: Config<T>, model: Model<T>) {
  const currentInputValue = toCurrentInputValue(config, model).toLowerCase();

  for (let i = 0; i < model.allItems.length; i++) {
    const item = model.allItems[i];

    if (!item) {
      continue;
    }

    if (
      config.toItemInputValue(item).toLowerCase().includes(currentInputValue)
    ) {
      yield item;
    }
  }
};

/** @module Model **/

/**
 * @group Model
 * The Model<T> represents the state of the combobox.
 * This is the data you will be saving in your app.
 */
export type Model<T> = ModelState & {
  /**
   * All items that can be selected. Items must be unique.
   */
  allItems: T[];
  selectedItems: T[];
  skipOnce: Msg<T>["type"][];
  selectMode: SelectMode;
  inputMode: InputMode;
  highlightMode: HighlightMode;
  /**
   * @description
   * The `visibleItemLimit` is used to limit the number of items that are visible in the suggestion dropdown.
   * Good for performance.
   */
  visibleItemLimit: number;
  /**
   * @description
   * When selecting an item from the drop down the combobox will not transition to a closed state.
   */
  disableCloseOnSelect?: boolean;
};

/**
 * @group Model
 */
type HighlightMode =
  | {
      type: "circular";
    }
  | {
      type: "clamp";
    };

/**
 * @group Model
 *
 */
export type SelectMode =
  | {
      type: "single-select";
    }
  | {
      type: "multi-select";
      selectedItemListDirection: SelectedItemListDirection;
      disableSelectedItemListKeyboardNavigation?: boolean;
    };

export type SelectedItemListDirection = "left-to-right" | "right-to-left";

/**
 * @group Model
 *
 */
export type InputMode =
  | {
      type: "select-only";
    }
  | {
      type: "search-mode";
      inputValue: string;
      hasSearched?: boolean;
    };

type Blurred = {
  type: "blurred";
};

type FocusedClosed = {
  type: "focused__closed";
};

type FocusedOpened = {
  type: "focused__opened";
};

type FocusedOpenedHighlighted = {
  type: "focused__opened__highlighted";
  highlightIndex: number;
  isKeyboardNavigation: boolean;
};

type SelectedItemHighlighted = {
  type: "selected-item-highlighted";
  focusedIndex: number;
};

type ModelState =
  | Blurred
  | FocusedClosed
  | FocusedOpened
  | FocusedOpenedHighlighted
  | SelectedItemHighlighted;

/**
 * @group Model
 *
 * The init function returns the initial state of the combobox.
 */
export const init = <T>({
  allItems,
  selectMode,
  inputMode,
  highlightMode,
  visibleItemLimit = 500,
  disableCloseOnSelect = false,
}: {
  allItems: T[];
  selectMode?: SelectMode;
  inputMode?: InputMode;
  highlightMode?: HighlightMode;
  visibleItemLimit?: number;
  disableCloseOnSelect?: boolean;
}): Model<T> => {
  return {
    type: "blurred",
    selectedItems: [],
    allItems,
    skipOnce: [],
    inputMode: inputMode
      ? inputMode
      : { type: "search-mode", hasSearched: false, inputValue: "" },
    selectMode: selectMode ? selectMode : { type: "single-select" },
    highlightMode: highlightMode ? highlightMode : { type: "clamp" },
    visibleItemLimit: Math.abs(visibleItemLimit),
    disableCloseOnSelect,
  };
};

/** @module Update **/

/**
 * @group Update
 *
 * The Msg<T> represents all the possible state transitions that can happen to the combobox.
 */
export type Msg<T> =
  | {
      type: "pressed-horizontal-arrow-key";
      key: "arrow-left" | "arrow-right";
    }
  | {
      type: "pressed-vertical-arrow-key";
      key: "arrow-up" | "arrow-down";
    }
  | {
      type: "pressed-backspace-key";
    }
  | {
      type: "pressed-escape-key";
    }
  | {
      type: "pressed-enter-key";
    }
  | {
      type: "pressed-key";
      key: string;
    }
  | {
      type: "pressed-item";
      item: T;
    }
  | {
      type: "focused-input";
    }
  | {
      type: "blurred-input";
    }
  | {
      type: "inputted-value";
      inputValue: string;
    }
  | {
      type: "hovered-over-item";
      index: number;
    }
  | {
      type: "pressed-input";
    }
  | {
      type: "pressed-unselect-all-button";
    }
  | {
      type: "pressed-unselect-button";
      item: T;
    }
  | {
      type: "focused-selected-item";
      item: T;
    }
  | {
      type: "blurred-selected-item";
      item: T;
    }
  | {
      type: "toggle-opened";
    }
  //
  // Setters
  //
  | {
      type: "set-all-items";
      allItems: T[];
    }
  | {
      type: "set-selected-items";
      selectedItems: T[];
    }
  | {
      type: "set-input-value";
      inputValue: string;
    }
  | {
      type: "set-highlight-index";
      highlightIndex: number;
    }
  | {
      type: "set-mode";
      mode: SelectMode;
    };

/**
 * @group Update
 *
 * The Effect<T> represents all the possible effects that can happen to the combobox.
 * You as the user of the library has to implement the side effects
 **/
export type Effect<T> =
  | {
      type: "scroll-item-into-view";
      item: T;
    }
  | {
      type: "focus-selected-item";
      item: T;
    }
  | {
      type: "focus-input";
    }
  | {
      type: "blur-input";
    };

/**
 * @group Update
 *
 * The Effect<T> represents all the possible effects that can happen to the combobox.
 * You as the user of the library has to implement the side effects
 **/
export type Event =
  | {
      type: "input-value-changed";
    }
  | {
      type: "selected-items-changed";
    };

/**
 *
 *
 */
export type Input<T> = {
  model: Model<T>;
  msg: Msg<T>;
};

/**
 *
 *
 */
export type Output<T> = {
  model: Model<T>;
  effects: Effect<T>[];
  events: Event[];
};

/**
 * A plugin is just a function that takes the previous and next state of the combobox and returns the final next state.
 */
export type Plugin<T> = (input: {
  /**
   * The config of the combobox
   */
  config: Config<T>;
  /**
   * The initial model of the combobox
   */
  initialModel: Model<T>;
  /**
   * This is the running input in the chain of plugins
   */
  input: Input<T>;
  /**
   * This is the running output in the chain of plugins
   * That will eventually be returned by the update function
   */
  output: Output<T>;
}) => Output<T>;

/**
 * @group Update
 *
 * The update function is the main function.
 * The update function takes the current state of the combobox and a message and returns the new state of the
 * combobox and effects that need to be run.
 */
export const update = <T>(
  config: Config<T>,
  input: Input<T>,
  plugins: Plugin<T>[] = []
): Output<T> => {
  const output = updateMain(config, input);

  let runningInput = input;
  let runningOutput = output;

  for (const plugin of plugins) {
    const currentOutput = plugin({
      config,
      initialModel: input.model,
      input: runningInput,
      output: runningOutput,
    });

    runningInput = {
      model: runningOutput.model,
      msg: runningInput.msg,
    };
    runningOutput = currentOutput;
  }

  return runningOutput;
};

const updateMain = <T>(config: Config<T>, input: Input<T>): Output<T> => {
  /**
   *
   *
   *
   */
  if (input.model.skipOnce.includes(input.msg.type)) {
    return {
      model: {
        ...input.model,
        skipOnce: removeFirst(
          (m) => m === input.msg.type,
          input.model.skipOnce
        ),
      },
      effects: [],
      events: [],
    };
  }

  /**
   *
   *
   *
   */

  let output: Output<T> = {
    model: input.model,
    effects: [],
    events: [],
  };

  /**
   *
   * Update Model
   *
   */

  output.model = updateSetters({
    msg: input.msg,
    model: updateModel(config, input),
    config,
  });

  /**
   *
   * Add Effects
   *
   */

  // scroll to selected item into view when state changes from closed to opened
  const selectedItem = toSelectedItem(output.model);
  if (isClosed(input.model) && isOpened(output.model) && selectedItem) {
    output.effects.push({
      type: "scroll-item-into-view",
      item: selectedItem,
    });
  }

  // focus on input when user presses it
  const didPressBlurredInput =
    input.msg.type === "pressed-input" && isBlurred(output.model);
  const didJustOpen = isClosed(input.model) && isOpened(output.model);
  if (didPressBlurredInput || didJustOpen) {
    output.effects.push({
      type: "focus-input",
    });
  }

  // scroll highlighted item into view when navigating with keyboard
  if (
    isHighlighted(output.model) &&
    input.msg.type === "pressed-vertical-arrow-key"
  ) {
    const visible = toVisibleItemsMemoized(config)(output.model);

    const highlightedItem = visible[output.model.highlightIndex];

    if (highlightedItem) {
      output.effects.push({
        type: "scroll-item-into-view",
        item: highlightedItem,
      });
      output.model = {
        ...output.model,
        skipOnce: ["hovered-over-item"],
      };
    }
  }

  // focus on selected item when highlighted
  if (isSelectedItemHighlighted(output.model)) {
    const selectedHighlightedItem = toSelectedItems(output.model)[
      output.model.focusedIndex
    ];
    if (selectedHighlightedItem) {
      output.effects.push({
        type: "focus-selected-item",
        item: selectedHighlightedItem,
      });
    }
  }

  // focus on input when navigating from selected item list to input
  if (
    input.model.type === "selected-item-highlighted" &&
    output.model.type === "focused__closed"
  ) {
    output.effects.push({
      type: "focus-input",
    });
  }

  // focus on input after clearing selectedItems
  if (input.msg.type === "pressed-unselect-all-button") {
    output.effects.push({
      type: "focus-input",
    });
  }

  /**
   *
   *
   * Add events
   *
   *
   */

  if (
    input.model.inputMode.type === "search-mode" &&
    output.model.inputMode.type === "search-mode" &&
    input.model.inputMode.inputValue !== output.model.inputMode.inputValue
  ) {
    output.events.push({ type: "input-value-changed" });
  }

  if (didSelectedItemsChange(config, input.model, output.model)) {
    output.events.push({ type: "selected-items-changed" });
  }

  return output;
};

const didSelectedItemsChange = <T>(
  config: Config<T>,
  prev: Model<T>,
  next: Model<T>
): boolean => {
  const intersected = intersectionLeft(
    config.toItemId,
    prev.selectedItems,
    next.selectedItems
  );

  return (
    intersected.length !== prev.selectedItems.length ||
    intersected.length !== next.selectedItems.length
  );
};

const updateSetters = <T>({
  config,
  model,
  msg,
}: {
  config: Config<T>;
  model: Model<T>;
  msg: Msg<T>;
}): Model<T> => {
  if (msg.type === "set-all-items") {
    const allItemsNew = toNextAllItems(
      config,
      msg.allItems,
      model.selectedItems
    );

    return {
      ...model,
      allItems: allItemsNew,
    };
  }

  if (msg.type === "set-selected-items") {
    const allItemsNew = toNextAllItems(
      config,
      model.allItems,
      msg.selectedItems
    );
    return {
      ...model,
      allItems: allItemsNew,
      selectedItems: msg.selectedItems,
    };
  }

  if (msg.type === "set-input-value") {
    if (model.inputMode.type === "search-mode") {
      return {
        ...model,
        inputMode: {
          type: "search-mode",
          inputValue: msg.inputValue,
          hasSearched: false,
        },
      };
    }
    return model;
  }

  if (msg.type === "set-highlight-index") {
    if (isHighlighted(model)) {
      return {
        ...model,
        highlightIndex: msg.highlightIndex,
      };
    }
    return model;
  }

  if (msg.type === "set-mode") {
    return {
      ...model,
      selectMode: msg.mode,
    };
  }

  return model;
};

/**
 * This ensures selected items is always a subset of all items and order is maintained.
 */
const toNextAllItems = <T>(
  config: Config<T>,
  allItems: T[],
  selectedItems: T[]
): T[] => {
  const allItemsNew: T[] = [];
  const selectedItemsById = new Map<string | number, T>();
  for (const selectedItem of selectedItems) {
    selectedItemsById.set(config.toItemId(selectedItem), selectedItem);
  }
  //
  //
  //
  for (const item of allItems) {
    const itemId = config.toItemId(item);
    if (selectedItemsById.has(itemId)) {
      selectedItemsById.delete(itemId);
    }
    allItemsNew.push(item);
  }
  //
  // Add remaining selected items to all items
  //
  for (const selectedItem of selectedItemsById.values()) {
    allItemsNew.push(selectedItem);
  }
  //
  //
  //
  return allItemsNew;
};

const updateModel = <T>(
  config: Config<T>,
  {
    model,
    msg,
  }: {
    model: Model<T>;
    msg: Msg<T>;
  }
): Model<T> => {
  const { toItemId } = config;
  switch (model.type) {
    case "blurred": {
      switch (msg.type) {
        case "toggle-opened": {
          return {
            ...model,
            type: "focused__opened",
          };
        }

        case "focused-input": {
          return resetInputValue({
            config,
            model: {
              ...model,
              type: "focused__opened",
            },
          });
        }

        case "pressed-unselect-all-button": {
          return {
            ...model,
            selectedItems: [],
          };
        }

        case "pressed-unselect-button": {
          return removeSelectedItem({
            config,
            model,
            item: msg.item,
          });
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "selected-item-highlighted",
            focusedIndex:
              findIndex(
                (item) => toItemId(item) === toItemId(msg.item),
                yieldSelectedItems(model)
              ) ?? 0,
          };
        }

        default: {
          return model;
        }
      }
    }

    case "focused__closed": {
      switch (msg.type) {
        case "toggle-opened": {
          return {
            ...model,
            type: "focused__opened",
          };
        }
        case "pressed-input": {
          return closedToOpened(model);
        }

        case "blurred-input": {
          return focusedToBlurred(model);
        }

        case "inputted-value": {
          if (model.inputMode.type === "select-only") {
            return resetInputValue({ config, model: closedToOpened(model) });
          }
          if (
            msg.inputValue === "" &&
            model.selectMode.type === "single-select"
          ) {
            return setHasSearched(
              setInputValue(
                closedToOpened({ ...model, selectedItems: [] }),
                ""
              ),
              false
            );
          }
          return setHasSearched(
            setInputValue(closedToOpened(model), msg.inputValue),
            true
          );
        }

        case "pressed-enter-key": {
          return resetInputValue({ config, model: closedToOpened(model) });
        }

        case "pressed-vertical-arrow-key": {
          if (model.selectMode.type === "single-select") {
            return resetInputValue({ config, model: closedToOpened(model) });
          }

          const selectedItemIndex = toSelectedItemIndex(config, model);

          return {
            ...closedToOpened(model),
            highlightIndex: selectedItemIndex ? selectedItemIndex : 0,
            type: "focused__opened__highlighted",
            isKeyboardNavigation: true,
          };
        }

        case "pressed-horizontal-arrow-key": {
          return updateSelectedItemKeyboardNavigation({ model, msg });
        }

        case "pressed-unselect-button": {
          return removeSelectedItem({
            config,
            model,
            item: msg.item,
          });
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "selected-item-highlighted",
            focusedIndex:
              findIndex(
                (item) => toItemId(item) === toItemId(msg.item),
                yieldSelectedItems(model)
              ) ?? 0,
          };
        }

        case "pressed-backspace-key": {
          if (
            model.inputMode.type === "select-only" &&
            model.selectMode.type === "single-select"
          ) {
            return closedToOpened({ ...model, selectedItems: [] });
          }

          if (
            model.inputMode.type === "search-mode" &&
            model.inputMode.inputValue === ""
          ) {
            return {
              ...model,
              selectedItems: toSelectedItems(model).slice(1),
            };
          }

          if (
            model.inputMode.type === "select-only" &&
            model.selectMode.type === "multi-select"
          ) {
            return {
              ...model,
              selectedItems: toSelectedItems(model).slice(1),
            };
          }

          return model;
        }

        case "pressed-unselect-all-button": {
          return {
            ...model,
            selectedItems: [],
            type: "focused__closed",
          };
        }

        default: {
          return model;
        }
      }
    }

    case "focused__opened": {
      switch (msg.type) {
        case "toggle-opened": {
          return {
            ...model,
            type: "focused__closed",
          };
        }

        case "hovered-over-item": {
          return {
            ...model,
            type: "focused__opened__highlighted",
            highlightIndex: msg.index,
            isKeyboardNavigation:false
          };
        }

        case "blurred-input": {
          return focusedToBlurred(model);
        }

        case "pressed-input": {
          return handlePressedInputWhenOpened(model);
        }

        case "pressed-item": {
          const pressedItem = msg.item;

          if (config.isEmptyItem(pressedItem)) {
            return {
              ...model,
              type: "focused__closed",
            };
          }

          return toggleSelected({
            config,
            item: pressedItem,
            model,
          });
        }

        case "inputted-value": {
          if (model.inputMode.type === "select-only") {
            return resetInputValue({ config, model });
          }

          if (
            msg.inputValue === "" &&
            model.selectMode.type === "single-select"
          ) {
            return clearInputValue({
              ...model,
              selectedItems: [],
              type: "focused__opened",
            });
          }

          return setHasSearched(setInputValue(model, msg.inputValue), true);
        }

        case "pressed-enter-key": {
          return resetInputValue({
            config,
            model: {
              ...model,
              type: "focused__closed",
            },
          });
        }

        case "pressed-vertical-arrow-key": {
          const visible = toVisibleItemsMemoized(config)(model);

          const selectedItemIndex = toSelectedItemIndex(config, model);

          if (!selectedItemIndex) {
            return {
              ...model,
              highlightIndex: 0,
              type: "focused__opened__highlighted",
              isKeyboardNavigation: true,
            };
          }

          const delta =
            model.selectMode.type === "multi-select"
              ? 0
              : msg.key === "arrow-down"
              ? 1
              : -1;

          const highlightIndex = toNextHighlightIndex(
            model.highlightMode,
            selectedItemIndex + delta,
            visible.length
          );

          return {
            ...model,
            highlightIndex,
            type: "focused__opened__highlighted",
            isKeyboardNavigation: true,
          };
        }

        case "pressed-escape-key": {
          return {
            ...model,
            type: "focused__closed",
          };
        }

        case "pressed-horizontal-arrow-key": {
          return updateSelectedItemKeyboardNavigation({ model, msg });
        }

        case "pressed-unselect-button": {
          return removeSelectedItem({
            config,
            model,
            item: msg.item,
          });
        }

        case "pressed-backspace-key": {
          if (
            model.inputMode.type === "select-only" &&
            model.selectMode.type === "single-select"
          ) {
            return { ...model, selectedItems: [] };
          }

          if (toSearchValue(model) === "") {
            return {
              ...model,
              selectedItems: toSelectedItems(model).slice(1),
            };
          }
          return model;
        }

        case "pressed-unselect-all-button": {
          return {
            ...model,
            selectedItems: [],
            type: "focused__opened",
          };
        }

        default: {
          return model;
        }
      }
    }

    case "focused__opened__highlighted": {
      switch (msg.type) {
        case "toggle-opened": {
          return {
            ...model,
            type: "focused__closed",
          };
        }

        case "hovered-over-item": {
          return { ...model, highlightIndex: msg.index };
        }

        case "blurred-input": {
          return focusedToBlurred(model);
        }

        case "pressed-item": {
          const pressedItem = msg.item;

          return toggleSelected({
            config,
            item: pressedItem,
            model,
          });
        }

        case "pressed-input": {
          return handlePressedInputWhenOpened(model);
        }

        case "inputted-value": {
          if (model.inputMode.type === "select-only") {
            return resetInputValue({
              config,
              model: {
                ...model,
                type: "focused__opened",
              },
            });
          }
          if (
            msg.inputValue === "" &&
            model.selectMode.type === "single-select"
          ) {
            return clearInputValue({
              ...model,
              selectedItems: [],
              type: "focused__opened",
            });
          }
          return setHasSearched(setInputValue(model, msg.inputValue), true);
        }

        case "pressed-vertical-arrow-key": {
          const visible = toVisibleItemsMemoized(config)(model);
          const delta = msg.key === "arrow-down" ? 1 : -1;
          const highlightIndex = toNextHighlightIndex(
            model.highlightMode,
            model.highlightIndex + delta,
            visible.length
          );
          return { ...model, highlightIndex: highlightIndex };
        }

        case "pressed-horizontal-arrow-key": {
          return updateSelectedItemKeyboardNavigation({ model, msg });
        }

        case "pressed-enter-key": {
          const visible = toVisibleItemsMemoized(config)(model);

          const enteredItem = visible[model.highlightIndex];

          if (!enteredItem) {
            return { ...model, type: "focused__closed" };
          }

          return toggleSelected({
            config,
            model,
            item: enteredItem,
          });
        }

        case "pressed-escape-key": {
          return { ...model, type: "focused__closed" };
        }

        case "pressed-unselect-button": {
          const removed = Array.from(
            keepIf(
              (x) => toItemId(x) !== toItemId(msg.item),
              yieldSelectedItems(model)
            )
          );

          return { ...model, selectedItems: removed };
        }

        case "focused-selected-item": {
          const selectedItemIndex = toSelectedItemIndex(config, model);
          return {
            ...model,
            type: "selected-item-highlighted",
            focusedIndex: selectedItemIndex ?? 0,
          };
        }

        case "pressed-backspace-key": {
          if (toSearchValue(model) === "") {
            const removed = toSelectedItems(model).slice(1);
            if (isNonEmpty(removed)) {
              return { ...model, selectedItems: removed };
            }
            return { ...model, type: "focused__opened" };
          }
          return model;
        }

        case "pressed-unselect-all-button": {
          return {
            ...model,
            selectedItems: [],
            type: "focused__opened",
          };
        }

        default: {
          return model;
        }
      }
    }

    case "selected-item-highlighted": {
      switch (msg.type) {
        case "pressed-horizontal-arrow-key": {
          if (model.selectMode.type !== "multi-select") {
            return clearInputValue({
              ...model,
              type: "focused__closed",
            });
          }

          if (
            model.focusedIndex === 0 &&
            model.selectMode.selectedItemListDirection === "right-to-left" &&
            msg.key === "arrow-right"
          ) {
            return clearInputValue({
              ...model,
              type: "focused__closed",
            });
          }

          if (
            model.focusedIndex === 0 &&
            model.selectMode.selectedItemListDirection === "left-to-right" &&
            msg.key === "arrow-left"
          ) {
            return clearInputValue({
              ...model,
              type: "focused__closed",
            });
          }

          const delta =
            model.selectMode.selectedItemListDirection === "right-to-left"
              ? msg.key === "arrow-right"
                ? -1
                : 1
              : model.selectMode.selectedItemListDirection === "left-to-right"
              ? msg.key === "arrow-left"
                ? -1
                : 1
              : 0;

          const selectedItemHighlightIndexNew = clampIndex(
            model.focusedIndex + delta,
            toSelectedItems(model).length
          );
          return {
            ...model,
            focusedIndex: selectedItemHighlightIndexNew,
          };
        }

        case "pressed-vertical-arrow-key": {
          if (model.selectMode.type === "single-select") {
            return resetInputValue({
              config,
              model: {
                ...model,
                type: "focused__opened",
              },
            });
          }

          const selectedItemIndex = toSelectedItemIndex(config, model);

          return resetInputValue({
            config,
            model: {
              ...model,
              highlightIndex: selectedItemIndex ? selectedItemIndex : 0,
              type: "focused__opened__highlighted",
              isKeyboardNavigation: true,
            },
          });
        }

        case "inputted-value": {
          if (model.inputMode.type === "select-only") {
            return setInputValue(
              {
                ...model,
                type: "focused__opened",
              },
              toInputValue({ config, model })
            );
          }
          if (toSearchValue(model) === "") {
            return setInputValue(
              {
                ...model,
                selectedItems: [],
                type: "focused__opened",
              },
              msg.inputValue
            );
          }
          return setInputValue(
            {
              ...model,

              type: "focused__opened",
            },
            msg.inputValue
          );
        }

        case "pressed-key":
        case "pressed-enter-key":
        case "pressed-escape-key": {
          return clearInputValue({ ...model, type: "focused__closed" });
        }

        case "pressed-backspace-key": {
          const removedHighlightedIndex = Array.from(
            keepIf(
              (_, index) => index !== model.focusedIndex,
              yieldSelectedItems(model)
            )
          );

          return clearInputValue({
            ...model,
            selectedItems: removedHighlightedIndex,
            type: "focused__closed",
          });
        }

        case "pressed-unselect-button": {
          const removedOne = Array.from(
            keepIf(
              (x) => toItemId(x) !== toItemId(msg.item),
              yieldSelectedItems(model)
            )
          );

          if (isNonEmpty(removedOne)) {
            const selectedItemHighlightIndex = clampIndex(
              model.focusedIndex,
              removedOne.length
            );
            return {
              ...model,
              selectedItems: removedOne,
              focusedIndex: selectedItemHighlightIndex,
            };
          }
          return clearInputValue({
            ...model,
            selectedItems: removedOne,
            type: "focused__closed",
          });
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "selected-item-highlighted",
            focusedIndex:
              findIndex(
                (item) => toItemId(item) === toItemId(msg.item),
                yieldSelectedItems(model)
              ) ?? 0,
          };
        }

        case "blurred-selected-item": {
          return {
            ...model,
            type: "blurred",
          };
        }

        case "focused-input": {
          return clearInputValue({
            ...model,
            type: "focused__opened",
          });
        }

        case "pressed-unselect-all-button": {
          return clearInputValue({
            ...model,
            selectedItems: [],
            type: "focused__opened",
          });
        }

        case "pressed-input": {
          return clearInputValue({ ...model, type: "focused__opened" });
        }

        default: {
          return model;
        }
      }
    }

    default: {
      const exhaustive: never = model;
      return exhaustive;
    }
  }
};

const closedToOpened = <T>(model: Model<T>): Model<T> => {
  if (
    model.inputMode.type === "search-mode" &&
    model.selectMode.type === "single-select"
  ) {
    return setHasSearched(
      {
        ...model,
        type: "focused__opened",
      },
      false
    );
  }
  return { ...model, type: "focused__opened" };
};

const focusedToBlurred = <T>(model: Model<T>): Model<T> => {
  if (
    model.inputMode.type === "search-mode" &&
    model.selectMode.type === "single-select"
  ) {
    return setHasSearched(
      {
        ...model,
        type: "blurred",
      },
      false
    );
  }
  return { ...model, type: "blurred" };
};

const handlePressedInputWhenOpened = <T>(model: Model<T>): Model<T> => {
  if (
    model.inputMode.type === "search-mode" &&
    model.inputMode.inputValue === ""
  ) {
    return {
      ...model,
      type: "focused__closed",
    };
  }

  if (model.inputMode.type === "select-only") {
    return {
      ...model,
      type: "focused__closed",
    };
  }

  return model;
};

/**
 * This is the logic for selecting a item in the drop down
 */
const toggleSelected = <T>({
  config,
  model,
  item,
}: {
  config: Config<T>;
  model: Model<T>;
  item: T;
}): Model<T> => {
  if (config.isEmptyItem(item)) {
    return {
      ...model,
      selectedItems: [],
      type: "focused__closed",
    };
  }

  const transitioned: Model<T> = model.disableCloseOnSelect
    ? model
    : { ...model, type: "focused__closed" };

  if (
    isItemSelected(config, model, item) &&
    model.selectMode.type === "multi-select"
  ) {
    return resetInputValue({
      config,
      model: removeSelectedItem({
        config,
        model: transitioned,
        item,
      }),
    });
  }

  return resetInputValue({
    config,
    model: addSelected({
      config,
      item,
      model: transitioned,
    }),
  });
};

const toSelectedItemIndex = <T>(
  config: Config<T>,
  model: Model<T>
): number | null => {
  const selectedItemIdSet = new Set<string | number>();
  for (const item of yieldSelectedItems(model)) {
    selectedItemIdSet.add(config.toItemId(item));
  }

  let index = 0;
  for (const item of toVisibleItemsMemoized(config)(model)) {
    if (selectedItemIdSet.has(config.toItemId(item))) {
      return index;
    }
    index++;
  }

  return null;
};

const setInputValue = <T>(model: Model<T>, inputValue: string): Model<T> => {
  if (model.inputMode.type === "search-mode") {
    return {
      ...model,
      inputMode: {
        ...model.inputMode,
        type: "search-mode",
        inputValue: inputValue,
      },
    };
  }

  return model;
};

const setHasSearched = <T>(model: Model<T>, hasSearched: boolean): Model<T> => {
  if (model.inputMode.type === "search-mode") {
    return {
      ...model,
      inputMode: {
        ...model.inputMode,
        type: "search-mode",
        hasSearched: hasSearched,
      },
    };
  }

  return model;
};

export const clearInputValue = <T>(model: Model<T>): Model<T> => {
  return setInputValue(model, "");
};

const toSearchValue = <T>(model: Model<T>): string => {
  return model.inputMode.type === "search-mode"
    ? model.inputMode.inputValue
    : "";
};

const addSelected = <T>({
  config,
  model,
  item,
}: {
  config: Config<T>;
  model: Model<T>;
  item: T;
}): Model<T> => {
  if (model.selectMode.type === "single-select") {
    return { ...model, selectedItems: [item] };
  }

  const selectedItemsNew = Array.from(
    yieldUnique(config.toItemId, [item, ...model.selectedItems])
  );

  return {
    ...model,
    selectedItems: selectedItemsNew,
  };
};

export const removeSelectedItem = <T>({
  config,
  model,
  item,
}: {
  config: Config<T>;
  model: Model<T>;
  item: T;
}): Model<T> => {
  if (model.selectMode.type === "single-select") {
    return { ...model, selectedItems: [] };
  }

  const removed = Array.from(
    keepIf(
      (x) => config.toItemId(x) !== config.toItemId(item),
      yieldSelectedItems(model)
    )
  );

  return {
    ...model,
    selectedItems: removed,
  };
};

const updateSelectedItemKeyboardNavigation = <T>({
  model,
  msg,
}: {
  model: Model<T> & FocusedState;
  msg: Msg<T>;
}): Model<T> => {
  if (!isSelected(model)) {
    return model;
  }

  if (msg.type !== "pressed-horizontal-arrow-key") {
    return model;
  }

  if (model.selectMode.type !== "multi-select") {
    return model;
  }

  if (model.selectMode.disableSelectedItemListKeyboardNavigation) {
    return model;
  }

  if (toSearchValue(model) !== "") {
    return model;
  }

  if (
    model.selectMode.selectedItemListDirection === "right-to-left" &&
    msg.key === "arrow-left"
  ) {
    return {
      ...model,
      type: "selected-item-highlighted",
      focusedIndex: 0,
    };
  }

  if (
    model.selectMode.selectedItemListDirection === "left-to-right" &&
    msg.key === "arrow-right"
  ) {
    return {
      ...model,
      type: "selected-item-highlighted",
      focusedIndex: 0,
    };
  }

  return model;
};

export const resetInputValue = <T>({
  config,
  model,
}: {
  config: Config<T>;
  model: Model<T>;
}): Model<T> => {
  return setInputValue(model, toInputValue({ config, model }));
};

const toInputValue = <T>({
  config,
  model,
}: {
  config: Config<T>;
  model: Model<T>;
}): string => {
  if (
    model.inputMode.type === "select-only" &&
    model.selectMode.type === "multi-select"
  ) {
    if (isHighlighted(model)) {
      const highlightedItem = model.allItems[model.highlightIndex];

      if (!highlightedItem) {
        return "";
      }

      return config.toItemInputValue(highlightedItem);
    }
    return "";
  }

  if (
    model.inputMode.type === "select-only" &&
    model.selectMode.type === "single-select"
  ) {
    const selectedItem = toSelectedItem(model);

    if (selectedItem) {
      return config.toItemInputValue(selectedItem);
    }

    const emptyItem = model.allItems.find((item) => config.isEmptyItem(item));

    if (isHighlighted(model)) {
      const highlightedItem = model.allItems[model.highlightIndex];

      if (!highlightedItem) {
        return emptyItem ? config.toItemInputValue(emptyItem) : "";
      }

      return config.toItemInputValue(highlightedItem);
    }

    return emptyItem ? config.toItemInputValue(emptyItem) : "";
  }
  const selectedItem = toSelectedItem(model);
  if (selectedItem && model.selectMode.type === "single-select") {
    return config.toItemInputValue(selectedItem);
  }

  return "";
};

export const toNextHighlightIndex = <T>(
  highlightMode: HighlightMode,
  highlightIndexNew: number,
  visibleItemLength: number
): number => {
  if (highlightMode.type === "circular") {
    return circularIndex(highlightIndexNew, visibleItemLength);
  }

  if (highlightMode.type === "clamp") {
    return clampIndex(highlightIndexNew, visibleItemLength);
  }

  return highlightIndexNew;
};

/** @module Selectors **/

/**
 * @group Selectors
 *
 * Utility function to determine if any item is selected.
 */
export const isSelected = <T>(model: Model<T>): model is SelectedState<T> => {
  return isNonEmpty(toSelectedItems(model));
};
export type SelectedState<T> = Model<T> & { selectedItems: NonEmpty<T> };

/**
 * @group Selectors
 *
 * Utility function to determine if in unselected state
 */
export const isUnselected = <T>(
  model: ModelState
): model is UnselectedState<T> => {
  return (
    model.type === "focused__opened" ||
    model.type === "focused__opened__highlighted" ||
    model.type === "blurred" ||
    model.type === "focused__closed"
  );
};
export type UnselectedState<T> = Exclude<ModelState, SelectedState<T>>;

/**
 * @group Selectors
 *
 * Utility function to determine if the dropdown is opened.
 */
export const isOpened = (model: ModelState): model is OpenedState => {
  return (
    model.type === "focused__opened" ||
    model.type === "focused__opened__highlighted"
  );
};
export type OpenedState = FocusedOpened | FocusedOpenedHighlighted;

/**
 * @group Selectors
 *
 * Utility function to determine if the dropdown is closed.
 */
export const isClosed = (model: ModelState): model is ClosedState => {
  return !isOpened(model);
};
export type ClosedState = Exclude<ModelState, OpenedState>;

/**
 * @group Selectors
 *
 * Utility function to determine if any item is highlighted.
 */
export const isHighlighted = (
  model: ModelState
): model is FocusedOpenedHighlighted => {
  return model.type === "focused__opened__highlighted";
};

/**
 * @group Selectors
 *
 * Utility function to determine if input is blurred.
 */
export const isBlurred = (model: ModelState): model is Blurred => {
  return model.type === "blurred";
};

/**
 * @group Selectors
 *
 */
export const isSelectedItemHighlighted = (
  model: ModelState
): model is SelectedItemHighlighted => {
  return model.type === "selected-item-highlighted";
};

/**
 * @group Selectors
 *
 * Utility function to determine if input is focused.
 */
export const isFocused = (model: ModelState): model is FocusedState => {
  return !isBlurred(model);
};
export type FocusedState = Exclude<ModelState, Blurred>;

/**
 * @group Selectors
 *
 * This function returns the value that the input element should have.
 */
export const toCurrentInputValue = <T>(
  config: Config<T>,
  model: Model<T>
): string => {
  if (model.inputMode.type === "select-only") {
    return toInputValue({ config, model });
  }

  if (model.type === "blurred") {
    return toInputValue({ config, model });
  }

  return toSearchValue(model);
};

/**
 * @group Selectors
 *
 * This function returns the highlighted item.
 */
export const toHighlightedItem = <T>(
  config: Config<T>,
  model: Model<T>
): T | null => {
  if (model.type !== "focused__opened__highlighted") {
    return null;
  }

  let index = 0;

  for (const item of toVisibleItemsMemoized(config)(model)) {
    if (index === model.highlightIndex) {
      return item;
    }
    index++;
  }

  return null;
};

/**
 * @group Selectors
 *
 * Utility function to determine if an item is highlighted.
 */
export const isItemHighlighted = <T>(
  config: Config<T>,
  model: Model<T>,
  item: T
): boolean => {
  const highlightedItem = toHighlightedItem(config, model);
  return Boolean(
    highlightedItem &&
      config.toItemId(highlightedItem) === config.toItemId(item)
  );
};

/**
 * @group Selectors
 *
 * This function returns the selected item
 */
export const toSelectedItems = <T>(model: Model<T>): T[] => {
  return Array.from(yieldSelectedItems(model));
};

export const yieldSelectedItems = function* <T>(model: Model<T>): Generator<T> {
  if (
    model.selectMode.type === "multi-select" &&
    model.selectMode.selectedItemListDirection === "right-to-left"
  ) {
    for (const x of model.selectedItems) {
      yield x;
    }
    return;
  }

  yield* yieldReverse(model.selectedItems);
};

/**
 * @group Selectors
 *
 * This function returns the selected item
 */
export const toSelectedItem = <T>(model: Model<T>): T | null => {
  for (const selectedItem of yieldSelectedItems(model)) {
    return selectedItem;
  }
  return null;
};

/**
 * @group Selectors
 *
 * Utility function to determine if an item is selected.
 */
export const isItemSelected = <T>(
  { toItemId }: Pick<Config<T>, "toItemId">,
  model: Model<T>,
  item: T
): boolean => {
  for (const selectedItem of yieldSelectedItems(model)) {
    if (toItemId(selectedItem) === toItemId(item)) {
      return true;
    }
  }
  return false;
};

/**
 * @group Selectors
 *
 * Selector function to determine if an index is selected.
 */
export const isItemIndexHighlighted = <T>(
  model: Model<T>,
  index: number
): boolean => {
  switch (model.type) {
    case "focused__opened__highlighted": {
      return model.highlightIndex === index;
    }
    default: {
      return false;
    }
  }
};

/**
 * @group Selectors
 *
 * Selector function to determine if an item is selected and highlighted.
 */
export const isItemSelectedAndHighlighted = <T>(
  config: Config<T>,
  model: Model<T>,
  item: T
): boolean => {
  return (
    isItemSelected(config, model, item) &&
    isItemHighlighted(config, model, item)
  );
};

/**
 *
 * @group Selectors
 *
 */
export const isSelectedItemFocused = <T>(
  config: Config<T>,
  model: Model<T>,
  selectedItem: T
) => {
  return (
    isSelectedItemHighlighted(model) &&
    findIndex(
      (item) => config.toItemId(item) === config.toItemId(selectedItem),
      yieldSelectedItems(model)
    ) === model.focusedIndex
  );
};

/**
 * @group Selectors
 *
 * This type represents all the possible states of an item
 */
export type SelectedItemStatus = "focused" | "blurred";

/**
 * @group Selectors
 *
 * This utility function returns the status of an item.
 */
export const toSelectedItemStatus = <T>(
  config: Config<T>,
  model: Model<T>,
  item: T
): SelectedItemStatus => {
  if (isSelectedItemFocused(config, model, item)) {
    return "focused";
  }

  return "blurred";
};

/**
 * @group Selectors
 *
 * This type represents all the possible states of an item
 */
export type ItemStatus =
  | "selected-and-highlighted"
  | "selected"
  | "highlighted"
  | "unselected";


export const isNavigatingWithKeyboard = <T>(model: Model<T>): boolean => {
  return model.type === 'focused__opened__highlighted' && model.isKeyboardNavigation;
}

/**
 * @group Selectors
 *
 * This utility function returns the status of an item.
 */
export const toItemStatus = <T>(
  config: Config<T>,
  model: Model<T>,
  item: T
): ItemStatus => {
  const isSelected = isItemSelected(config, model, item);
  const isHighlighted = isItemHighlighted(config, model, item);

  if (isSelected && isHighlighted) {
    return "selected-and-highlighted";
  }

  if (isSelected) {
    return "selected";
  }

  if (isHighlighted) {
    return "highlighted";
  }

  return "unselected";
};

export const yieldVisibleItems = function* <T>(
  config: Config<T>,
  model: Model<T>
): Generator<T> {
  //
  //
  //

  if (model.inputMode.type === "select-only") {
    let index = 0;
    for (const item of model.allItems) {
      if (index >= model.visibleItemLimit) {
        break;
      }
      yield item;
      index++;
    }
    return;
  }

  //
  //
  //

  if (model.inputMode.type === "search-mode" && !model.inputMode.hasSearched) {
    let index = 0;
    for (const item of model.allItems) {
      if (index >= model.visibleItemLimit) {
        break;
      }
      yield item;
      index++;
    }
    return;
  }

  //
  //
  //

  let index = 0;
  for (const item of config.deterministicFilter(model)) {
    if (index >= model.visibleItemLimit) {
      break;
    }
    yield item;
    index++;
  }
};

/**
 * @group Selectors
 *
 * This function returns the all the visible items.
 */
const toVisibleItems = <T>(config: Config<T>, model: Model<T>): T[] => {
  return Array.from(yieldVisibleItems(config, model));
};

/**
 * Get visible items memoized
 */
export const toVisibleItemsMemoized = <T>(config: Config<T>) => {
  return memoize(
    config.visibleItemCache,
    (model) => {
      return config.deterministicFilterKeyFn(model);
    },
    (model: Model<T>): T[] => {
      return toVisibleItems(config, model);
    }
  );
};

/**
 * @group Selectors
 *
 * This function returns the all the visible items with their status.
 */
type RenderItem<T> = {
  item: T;
  status: ItemStatus;
  inputValue: string;
  aria: ReturnType<typeof ariaItem>;
};
export const yieldRenderItems = function* <T>(
  config: Config<T>,
  model: Model<T>
): Generator<RenderItem<T>> {
  const selectedItemIdSet = new Set<string | number>();
  for (const item of yieldSelectedItems(model)) {
    selectedItemIdSet.add(config.toItemId(item));
  }

  const highlightedIndex =
    model.type === "focused__opened__highlighted" ? model.highlightIndex : null;

  let index = 0;

  for (const item of toVisibleItemsMemoized(config)(model)) {
    const isSelected = selectedItemIdSet.has(config.toItemId(item));
    const isHighlighted = index === highlightedIndex;

    yield {
      item,
      status:
        isSelected && isHighlighted
          ? "selected-and-highlighted"
          : isSelected
          ? "selected"
          : isHighlighted
          ? "highlighted"
          : "unselected",
      inputValue: config.toItemInputValue(item),
      aria: ariaItem(config, model, item),
    };
    index++;
  }
};

/**
 * TODO make it more obvious that this using caching it was causing a CONFUSING bugs
 */
export const toRenderItems = <T>(
  config: Config<T>,
  model: Model<T>
): RenderItem<T>[] => {
  return Array.from(yieldRenderItems(config, model));
};

/**
 * @group Selectors
 *
 * This function returns the all the visible items with their status.
 */
type RenderSelectedItem<T> = {
  item: T;
  status: SelectedItemStatus;
  inputValue: string;
  aria: ReturnType<typeof ariaSelectedItem>;
  ariaUnselectButton: ReturnType<typeof ariaUnselectButton>;
};
export const yieldRenderSelectedItems = function* <T>(
  config: Config<T>,
  model: Model<T>
): Generator<RenderSelectedItem<T>> {
  for (const item of yieldSelectedItems(model)) {
    yield {
      item,
      status: toSelectedItemStatus(config, model, item),
      inputValue: config.toItemInputValue(item),
      aria: ariaSelectedItem(config, model, item),
      ariaUnselectButton: ariaUnselectButton(),
    };
  }
};
export const toRenderSelectedItems = <T>(
  config: Config<T>,
  model: Model<T>
): RenderSelectedItem<T>[] => {
  return Array.from(yieldRenderSelectedItems(config, model));
};

/** @module Helpers **/

/**
 * @group Helpers
 *
 * This helper function converts a keyboard event key property to a message.
 **/
export const keyToMsg = <T>(
  key: string
): Msg<T> & { shouldPreventDefault?: boolean } => {
  const eq = (a: string, b: string) =>
    a.toLowerCase().trim() === b.toLowerCase().trim();

  if (eq(key, "Backspace")) {
    return {
      type: "pressed-backspace-key",
    };
  }

  if (eq(key, "ArrowLeft")) {
    return {
      type: "pressed-horizontal-arrow-key",
      key: "arrow-left",
    };
  }

  if (eq(key, "ArrowRight")) {
    return {
      type: "pressed-horizontal-arrow-key",
      key: "arrow-right",
    };
  }

  if (eq(key, "ArrowDown")) {
    return {
      type: "pressed-vertical-arrow-key",
      key: "arrow-down",
      shouldPreventDefault: true,
    };
  }

  if (eq(key, "ArrowUp")) {
    return {
      type: "pressed-vertical-arrow-key",
      key: "arrow-up",
      shouldPreventDefault: true,
    };
  }

  if (eq(key, "Escape")) {
    return { type: "pressed-escape-key" };
  }

  if (eq(key, "Enter")) {
    return { type: "pressed-enter-key", shouldPreventDefault: true };
  }

  return { type: "pressed-key", key };
};

export const toSelectedItemDirection = <T>(
  model: Model<T>
): SelectedItemListDirection | null => {
  if (model.selectMode.type === "multi-select") {
    return model.selectMode.selectedItemListDirection;
  }
  return null;
};

/**
 * @group Selectors
 *
 * This function returns an object of all the returns of all the selectors.
 */
export const toState = <T>(config: Config<T>, model: Model<T>) => {
  return {
    aria: aria(config, model),
    allItems: model.allItems,
    renderItems: toRenderItems(config, model),
    renderSelectedItems: toRenderSelectedItems(config, model),
    isOpened: isOpened(model),
    selectedItems: toSelectedItems(model),
    inputValue: toCurrentInputValue(config, model),
    isBlurred: isBlurred(model),
    isFocused: isFocused(model),
    selectedItem: toSelectedItem(model),
    highlightedItem: toHighlightedItem(config, model),
    selectedItemDirection: toSelectedItemDirection(model),
    isItemHighlighted: (item: T) => isItemHighlighted<T>(config, model, item),
    isItemSelected: (item: T) => isItemSelected<T>(config, model, item),
    isItemIndexHighlighted: (index: number) =>
      isItemIndexHighlighted<T>(model, index),
    itemStatus: (item: T) => toItemStatus(config, model, item),
    isSelectedItemFocused: (selectedItem: T) =>
      isSelectedItemFocused(config, model, selectedItem),
  } as const;
};

/**
 * Run effects on the output of the update function
 */
export const handleEffects = <T>(
  { effects }: { effects: Effect<T>[] },
  handlers: {
    scrollItemIntoView: (item: T) => void;
    focusInput: () => void;
    focusSelectedItem: (selectedIem: T) => void;
    blurInput?: () => void;
  }
) => {
  for (let i = 0; i < effects.length; i++) {
    const effect = effects[i];
    if (effect) {
      switch (effect.type) {
        case "scroll-item-into-view": {
          handlers.scrollItemIntoView(effect.item);
          break;
        }
        case "focus-selected-item": {
          handlers.focusSelectedItem(effect.item);
          break;
        }
        case "focus-input": {
          handlers.focusInput();
          break;
        }
        case "blur-input": {
          handlers.blurInput?.();
          break;
        }
        default: {
          const check: never = effect;
          return check;
        }
      }
    }
  }
};

export const handleEvents = <T>(
  { events }: { events: Event[] },
  handlers: {
    onInputValueChanged?: () => void;
    onSelectedItemsChanged?: () => void;
  }
) => {
  for (const event of events) {
    switch (event.type) {
      case "input-value-changed": {
        handlers.onInputValueChanged?.();
        break;
      }

      case "selected-items-changed": {
        handlers.onSelectedItemsChanged?.();
        break;
      }

      default: {
        const check: never = event;
        return check;
      }
    }
  }
};
