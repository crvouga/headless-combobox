// Links
// https://github.com/mui/material-ui/blob/master/packages/mui-base/src/useAutocomplete/useAutocomplete.js#L332
//
import {
  aria,
  ariaItem,
  ariaSelectedItem,
  ariaUnselectButton,
} from "./combobox-html-wai-aria";
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
  deterministicFilterCacheKeyFn: (model: Model<T>) => string;
  isEmptyItem: (value: T) => boolean;
  sortSelectedItems?: (a: T, b: T) => number;
  namespace: string;
  filteredItemCache: Map<string, T[]>;
  itemStore?: ItemStore<T>;
};

export const defaultDeterministicFilterCacheKeyFn = <T>(
  config: Pick<Config<T>, "toItemId">,
  model: Model<T>
): string => {
  const inputVal =
    model.inputMode.type === "search-mode" ? model.inputMode.inputValue : "";
  const selectedItemsHash = model.selectedItems.map(config.toItemId).join(" ");
  const key = `${model.inputMode.type} ${inputVal} ${model.allItemsHash} ${selectedItemsHash}`;
  return key;
};

/**
 * @group Config
 */
export const initConfig = <T>({
  namespace,
  isEmptyItem = () => false,
  sortSelectedItems,
  filteredItemCacheCapacity = 100,
  ...config
}: {
  toItemId: (item: T) => string | number;
  toItemInputValue: (item: T) => string;
  isEmptyItem?: (item: T) => boolean;
  deterministicFilter?: (model: Model<T>) => Iterable<T>;
  deterministicFilterCacheKeyFn?: (model: Model<T>) => string;
  sortSelectedItems?: (a: T, b: T) => number;
  namespace?: string;
  filteredItemCacheCapacity?: number;
}): Config<T> => {
  const deterministicFilter: Config<T>["deterministicFilter"] =
    config.deterministicFilter
      ? config.deterministicFilter
      : (model) => simpleFilter(configFull, model);

  const deterministicFilterCacheKeyFn: Config<T>["deterministicFilterCacheKeyFn"] =
    config.deterministicFilterCacheKeyFn
      ? config.deterministicFilterCacheKeyFn
      : (model) => defaultDeterministicFilterCacheKeyFn(config, model);

  const configFull: Config<T> = {
    ...config,
    isEmptyItem,
    filteredItemCache: new LRUCache(filteredItemCacheCapacity),
    namespace: namespace ?? "combobox",
    deterministicFilter,
    deterministicFilterCacheKeyFn: deterministicFilterCacheKeyFn,
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
  allItemsHash: string;
  selectedItems: T[];
  skipOnce: Msg<T>["type"][];
  selectMode: SelectMode;
  inputMode: InputMode;
  highlightMode: HighlightMode;
  /**
   * @description
   * The `filteredItemLimit` is used to limit the number of items that are filtered in the suggestion dropdown.
   * Good for performance.
   */
  filteredItemLimit: number;
  /**
   * @description
   * When selecting an item from the drop down the combobox will not transition to a closed state.
   */
  disableCloseOnSelect?: boolean;
};

const toAllItemsHash = <T>(config: Config<T>, allItems: T[]): string => {
  let hash = "";
  for (const item of allItems) {
    hash += `${config.toItemId(item)} `;
  }
  return hash;
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
  type: "focused-closed";
};

type FocusedOpened = {
  type: "focused-opened";
};

type FocusedOpenedHighlighted = {
  type: "focused-opened-highlighted";
  highlightIndex: number;
  isKeyboardNavigation: boolean;
};

type HighlightedSelected = {
  type: "highlighted-selected";
  focusedIndex: number;
};

type ModelState =
  | Blurred
  | FocusedClosed
  | FocusedOpened
  | FocusedOpenedHighlighted
  | HighlightedSelected;

/**
 * @group Model
 *
 * The init function returns the initial state of the combobox.
 */
export const init = <T>(
  config: Config<T>,
  {
    allItems,
    selectMode,
    inputMode,
    highlightMode,
    filteredItemLimit = Infinity,
    disableCloseOnSelect = false,
  }: {
    allItems: T[];
    selectMode?: SelectMode;
    inputMode?: InputMode;
    highlightMode?: HighlightMode;
    filteredItemLimit?: number;
    disableCloseOnSelect?: boolean;
  }
): Model<T> => {
  return {
    type: "blurred",
    selectedItems: [],
    allItems,
    allItemsHash: toAllItemsHash(config, allItems),
    skipOnce: [],
    inputMode: inputMode
      ? inputMode
      : { type: "search-mode", hasSearched: false, inputValue: "" },
    selectMode: selectMode ? selectMode : { type: "single-select" },
    highlightMode: highlightMode ? highlightMode : { type: "clamp" },
    filteredItemLimit: Math.abs(filteredItemLimit),
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
  | {
      type: "pressed-clear-button";
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
      index: number;
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

export const initOutput = <T>(model: Model<T>): Output<T> => {
  return {
    model,
    effects: [],
    events: [],
  };
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
  const output = updateMain<T>()(config, input);

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

export const chainUpdates = <T>(
  acc: Output<T>,
  ...updates: ((model: Model<T>) => Output<T>)[]
): Output<T> => {
  const [update, ...rest] = updates;

  if (!update) {
    return acc;
  }

  const updated = update(acc.model);

  return chainUpdates(
    {
      model: updated.model,
      effects: acc.effects.concat(updated.effects),
      events: acc.events.concat(updated.events),
    },
    ...rest
  );
};

type Update<T> = (config: Config<T>, input: Input<T>) => Output<T>;

const updateClearButton =
  <T>(): Update<T> =>
  (_config, input) => {
    if (input.msg.type === "pressed-clear-button") {
      return chainUpdates(
        initOutput(input.model),
        (model) => initOutput(clearInputValue(model)),
        (model) => {
          if (model.selectMode.type === "single-select") {
            return initOutput({ ...model, selectedItems: [] });
          }
          return initOutput(model);
        }
      );
    }

    return initOutput(input.model);
  };

const updateMain =
  <T>(): Update<T> =>
  (config, input) => {
    return chainUpdates(
      { model: input.model, effects: [], events: [] },
      (model) => updateMainToBeRefactored(config, { model, msg: input.msg }),
      (model) => updateClearButton<T>()(config, { model, msg: input.msg }),
    );
  };

const updateMainToBeRefactored = <T>(
  config: Config<T>,
  input: Input<T>
): Output<T> => {
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
  const selectedItem = toSelectedItem(config, output.model);
  if (isClosed(input.model) && isOpened(output.model) && selectedItem) {
    output.effects.push({
      type: "scroll-item-into-view",
      item: selectedItem,
      index: toSelectedItemIndex(config, output.model) ?? -1,
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
    const filtered = toFilteredItemsMemoized(config)(output.model);

    const highlightedItem = filtered[output.model.highlightIndex];

    if (highlightedItem) {
      output.effects.push({
        type: "scroll-item-into-view",
        item: highlightedItem,
        index: output.model.highlightIndex,
      });
      output.model = {
        ...output.model,
        skipOnce: ["hovered-over-item"],
      };
    }
  }

  // focus on selected item when highlighted
  if (isSelectedItemHighlighted(output.model)) {
    const selectedHighlightedItem = toSelectedItems(config, output.model)[
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
    input.model.type === "highlighted-selected" &&
    output.model.type === "focused-closed"
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

    // TODO move this somewhere else
    if (toSelectedItems(config, output.model).length === 0) {
      output.model = clearInputValue(output.model);
    }
  }

  return output;
};

export const didSelectedItemsChange = <T>(
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
  switch (msg.type) {
    case "set-all-items": {
      const selectedItemsNew = intersectionLeft(
        config.toItemId,
        model.selectedItems,
        msg.allItems
      );

      return {
        ...model,
        allItems: msg.allItems,
        allItemsHash: toAllItemsHash(config, msg.allItems),
        selectedItems: selectedItemsNew,
      };
    }

    case "set-selected-items": {
      const allItemsNew = toNextAllItems(
        config,
        model.allItems,
        msg.selectedItems
      );

      const modelNew: Model<T> = {
        ...model,
        allItems: allItemsNew,
        selectedItems: msg.selectedItems,
        allItemsHash: toAllItemsHash(config, allItemsNew),
      };

      if (
        modelNew.selectMode.type === "single-select" &&
        model.selectedItems.length === 0 &&
        modelNew.selectedItems.length > 0
      ) {
        return resetInputValue({ config, model: modelNew });
      }

      if(isBlurred(modelNew)) {
        return resetInputValue({ config, model: modelNew });
      }

      return modelNew;
    }

    case "set-input-value": {
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

    case "set-highlight-index": {
      if (isHighlighted(model)) {
        return {
          ...model,
          highlightIndex: msg.highlightIndex,
        };
      }
      return model;
    }

    case "set-mode": {
      return {
        ...model,
        selectMode: msg.mode,
      };
    }
    default: {
      return model;
    }
  }
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
            type: "focused-opened",
          };
        }

        case "focused-input": {
          return resetInputValue({
            config,
            model: {
              ...model,
              type: "focused-closed",
            },
          });
        }

        case "pressed-input": {
          return {
            ...model,
            type: "focused-opened",
          };
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
            type: "highlighted-selected",
            focusedIndex:
              findIndex(
                (item) => toItemId(item) === toItemId(msg.item),
                yieldSelectedItems(config, model)
              ) ?? 0,
          };
        }

        default: {
          return model;
        }
      }
    }

    case "focused-closed": {
      switch (msg.type) {
        case "toggle-opened": {
          return {
            ...model,
            type: "focused-opened",
          };
        }
        case "pressed-input": {
          return closedToOpened(model);
        }

        case "blurred-input": {
          return focusedToBlurred(config, model);
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
            return closedToOpened(model);
          }

          const selectedItemIndex = toSelectedItemIndex(config, model);

          return {
            ...model,
            ...closedToOpened(model),
            highlightIndex: selectedItemIndex ? selectedItemIndex : 0,
            type: "focused-opened-highlighted",
            isKeyboardNavigation: true,
          };
        }

        case "pressed-horizontal-arrow-key": {
          return updateSelectedItemKeyboardNavigation({ config, model, msg });
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
            type: "highlighted-selected",
            focusedIndex:
              findIndex(
                (item) => toItemId(item) === toItemId(msg.item),
                yieldSelectedItems(config, model)
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
              selectedItems: toSelectedItems(config, model).slice(1),
            };
          }

          if (
            model.inputMode.type === "select-only" &&
            model.selectMode.type === "multi-select"
          ) {
            return {
              ...model,
              selectedItems: toSelectedItems(config, model).slice(1),
            };
          }

          return model;
        }

        case "pressed-unselect-all-button": {
          return {
            ...model,
            selectedItems: [],
            type: "focused-closed",
          };
        }

        default: {
          return model;
        }
      }
    }

    case "focused-opened": {
      switch (msg.type) {
        case "toggle-opened": {
          return {
            ...model,
            type: "focused-closed",
          };
        }

        case "hovered-over-item": {
          return {
            ...model,
            type: "focused-opened-highlighted",
            highlightIndex: msg.index,
            isKeyboardNavigation: false,
          };
        }

        case "blurred-input": {
          return focusedToBlurred(config, model);
        }

        case "pressed-input": {
          return handlePressedInputWhenOpened(model);
        }

        case "pressed-item": {
          const pressedItem = msg.item;

          if (config.isEmptyItem(pressedItem)) {
            return {
              ...model,
              type: "focused-closed",
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
              type: "focused-opened",
            });
          }

          return setHasSearched(setInputValue(model, msg.inputValue), true);
        }

        case "pressed-enter-key": {
          return resetInputValue({
            config,
            model: {
              ...model,
              type: "focused-closed",
            },
          });
        }

        case "pressed-vertical-arrow-key": {
          const filtered = toFilteredItemsMemoized(config)(model);

          const selectedItemIndex = toSelectedItemIndex(config, model);

          if (!selectedItemIndex) {
            return {
              ...model,
              highlightIndex: 0,
              type: "focused-opened-highlighted",
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
            filtered.length
          );

          return {
            ...model,
            highlightIndex,
            type: "focused-opened-highlighted",
            isKeyboardNavigation: true,
          };
        }

        case "pressed-escape-key": {
          return {
            ...model,
            type: "focused-closed",
          };
        }

        case "pressed-horizontal-arrow-key": {
          return updateSelectedItemKeyboardNavigation({ config, model, msg });
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
              selectedItems: toSelectedItems(config, model).slice(1),
            };
          }
          return model;
        }

        case "pressed-unselect-all-button": {
          return {
            ...model,
            selectedItems: [],
            type: "focused-opened",
          };
        }

        default: {
          return model;
        }
      }
    }

    case "focused-opened-highlighted": {
      switch (msg.type) {
        case "toggle-opened": {
          return {
            ...model,
            type: "focused-closed",
          };
        }

        case "hovered-over-item": {
          return {
            ...model,
            highlightIndex: msg.index,
            isKeyboardNavigation: false,
          };
        }

        case "blurred-input": {
          return focusedToBlurred(config, model);
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
                type: "focused-opened",
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
              type: "focused-opened",
            });
          }
          return setHasSearched(
            setInputValue({ ...model, type: "focused-opened" }, msg.inputValue),
            true
          );
        }

        case "pressed-vertical-arrow-key": {
          const filtered = toFilteredItemsMemoized(config)(model);
          const delta = msg.key === "arrow-down" ? 1 : -1;
          const highlightIndex = toNextHighlightIndex(
            model.highlightMode,
            model.highlightIndex + delta,
            filtered.length
          );
          return {
            ...model,
            highlightIndex: highlightIndex,
            isKeyboardNavigation: true,
          };
        }

        case "pressed-horizontal-arrow-key": {
          return updateSelectedItemKeyboardNavigation({ config, model, msg });
        }

        case "pressed-enter-key": {
          const filtered = toFilteredItemsMemoized(config)(model);

          const enteredItem = filtered[model.highlightIndex];

          if (!enteredItem) {
            return { ...model, type: "focused-closed" };
          }

          return toggleSelected({
            config,
            model,
            item: enteredItem,
          });
        }

        case "pressed-escape-key": {
          return { 
            ...model,
             type: "focused-closed" 
          };
        }

        case "pressed-unselect-button": {
          const removed = Array.from(
            keepIf(
              (x) => toItemId(x) !== toItemId(msg.item),
              yieldSelectedItems(config, model)
            )
          );

          return { ...model, selectedItems: removed };
        }

        case "focused-selected-item": {
          const selectedItemIndex = toSelectedItemIndex(config, model);
          return {
            ...model,
            type: "highlighted-selected",
            focusedIndex: selectedItemIndex ?? 0,
          };
        }

        case "pressed-backspace-key": {
          if (toSearchValue(model) === "") {
            const removed = toSelectedItems(config, model).slice(1);
            if (isNonEmpty(removed)) {
              return { ...model, selectedItems: removed };
            }
            return { ...model, type: "focused-opened" };
          }
          return model;
        }

        case "pressed-unselect-all-button": {
          return {
            ...model,
            selectedItems: [],
            type: "focused-opened",
          };
        }

        default: {
          return model;
        }
      }
    }

    case "highlighted-selected": {
      switch (msg.type) {
        case "pressed-horizontal-arrow-key": {
          if (model.selectMode.type !== "multi-select") {
            return clearInputValue({
              ...model,
              type: "focused-closed",
            });
          }

          if (
            model.focusedIndex === 0 &&
            model.selectMode.selectedItemListDirection === "right-to-left" &&
            msg.key === "arrow-right"
          ) {
            return clearInputValue({
              ...model,
              type: "focused-closed",
            });
          }

          if (
            model.focusedIndex === 0 &&
            model.selectMode.selectedItemListDirection === "left-to-right" &&
            msg.key === "arrow-left"
          ) {
            return clearInputValue({
              ...model,
              type: "focused-closed",
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
            toSelectedItems(config, model).length
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
                type: "focused-opened",
              },
            });
          }

          const selectedItemIndex = toSelectedItemIndex(config, model);

          return resetInputValue({
            config,
            model: {
              ...model,
              highlightIndex: selectedItemIndex ? selectedItemIndex : 0,
              type: "focused-opened-highlighted",
              isKeyboardNavigation: true,
            },
          });
        }

        case "inputted-value": {
          if (model.inputMode.type === "select-only") {
            return setInputValue(
              {
                ...model,
                type: "focused-opened",
              },
              toInputValue({ config, model })
            );
          }
          if (toSearchValue(model) === "") {
            return setInputValue(
              {
                ...model,
                selectedItems: [],
                type: "focused-opened",
              },
              msg.inputValue
            );
          }
          return setInputValue(
            {
              ...model,

              type: "focused-opened",
            },
            msg.inputValue
          );
        }

        case "pressed-key":
        case "pressed-enter-key": 
        case "pressed-escape-key": {
          return clearInputValue({ ...model, type: "focused-closed" });
        }

        case "pressed-backspace-key": {
          const removedHighlightedIndex = Array.from(
            keepIf(
              (_, index) => index !== model.focusedIndex,
              yieldSelectedItems(config, model)
            )
          );

          return clearInputValue({
            ...model,
            selectedItems: removedHighlightedIndex,
            type: "focused-closed",
          });
        }

        case "pressed-unselect-button": {
          const removedOne = Array.from(
            keepIf(
              (x) => toItemId(x) !== toItemId(msg.item),
              yieldSelectedItems(config, model)
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
            type: "focused-closed",
          });
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "highlighted-selected",
            focusedIndex:
              findIndex(
                (item) => toItemId(item) === toItemId(msg.item),
                yieldSelectedItems(config, model)
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
            type: "focused-opened",
          });
        }

        case "pressed-unselect-all-button": {
          return clearInputValue({
            ...model,
            selectedItems: [],
            type: "focused-opened",
          });
        }

        case "pressed-input": {
          return clearInputValue({ ...model, type: "focused-opened" });
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
        type: "focused-opened",
      },
      false
    );
  }
  return { ...model, type: "focused-opened" };
};

const focusedToBlurred = <T>(config: Config<T>, model: Model<T>): Model<T> => {
  if (
    model.inputMode.type === "search-mode" &&
    model.selectMode.type === "single-select"
  ) {
    const modelNew = setHasSearched(
      {
        ...model,
        type: "blurred",
      },
      false
    )
    const resetted = resetInputValue({ config, model: modelNew });
    return resetted
  }
  return resetInputValue({ config, model: { ...model, type: "blurred" } });
};

const handlePressedInputWhenOpened = <T>(model: Model<T>): Model<T> => {
  if (
    model.inputMode.type === "search-mode" &&
    model.inputMode.inputValue === ""
  ) {
    return {
      ...model,
      type: "focused-closed",
    };
  }

  if (model.inputMode.type === "select-only") {
    return {
      ...model,
      type: "focused-closed",
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
      type: "focused-closed",
    };
  }

  const transitioned: Model<T> = model.disableCloseOnSelect
    ? model
    : { ...model, type: "focused-closed" };

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
  for (const item of yieldSelectedItems(config, model)) {
    selectedItemIdSet.add(config.toItemId(item));
  }

  let index = 0;
  for (const item of toFilteredItemsMemoized(config)(model)) {
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

export const toSearchValue = <T>(model: Model<T>): string => {
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
      yieldSelectedItems(config, model)
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
  config,
}: {
  config: Config<T>;
  model: Model<T> & FocusedState;
  msg: Msg<T>;
}): Model<T> => {
  if (!isSelected(config, model)) {
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
      type: "highlighted-selected",
      focusedIndex: 0,
    };
  }

  if (
    model.selectMode.selectedItemListDirection === "left-to-right" &&
    msg.key === "arrow-right"
  ) {
    return {
      ...model,
      type: "highlighted-selected",
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
    const selectedItem = toSelectedItem(config, model);

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
  const selectedItem = toSelectedItem(config, model);
  if (selectedItem && model.selectMode.type === "single-select") {
    return config.toItemInputValue(selectedItem);
  }

  return "";
};

export const toNextHighlightIndex = <T>(
  highlightMode: HighlightMode,
  highlightIndexNew: number,
  filteredItemLength: number
): number => {
  if (highlightMode.type === "circular") {
    return circularIndex(highlightIndexNew, filteredItemLength);
  }

  if (highlightMode.type === "clamp") {
    return clampIndex(highlightIndexNew, filteredItemLength);
  }

  return highlightIndexNew;
};

/** @module Selectors **/

/**
 * @group Selectors
 *
 * Utility function to determine if any item is selected.
 */
export const isSelected = <T>(
  config: Config<T>,
  model: Model<T>
): model is SelectedState<T> => {
  return isNonEmpty(toSelectedItems(config, model));
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
    model.type === "focused-opened" ||
    model.type === "focused-opened-highlighted" ||
    model.type === "blurred" ||
    model.type === "focused-closed"
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
    model.type === "focused-opened" ||
    model.type === "focused-opened-highlighted"
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
  return model.type === "focused-opened-highlighted";
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
): model is HighlightedSelected => {
  return model.type === "highlighted-selected";
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
  if (model.type !== "focused-opened-highlighted") {
    return null;
  }

  let index = 0;

  for (const item of toFilteredItemsMemoized(config)(model)) {
    if (index === model.highlightIndex) {
      return item;
    }
    index++;
  }

  return null;
};

export const toHighlightedIndex = <T>(model: Model<T>): number => {
  if (model.type !== "focused-opened-highlighted") {
    return -1;
  }

  return model.highlightIndex;
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
export const toSelectedItems = <T>(config: Config<T>, model: Model<T>): T[] => {
  return Array.from(yieldSelectedItems(config, model));
};

const sortSelectedItems = <T>(config: Config<T>, model: Model<T>): T[] => {
  if (config.sortSelectedItems) {
    return [...model.selectedItems].sort(config.sortSelectedItems);
  }
  return model.selectedItems;
};

export const yieldSelectedItems = function* <T>(
  config: Config<T>,
  model: Model<T>
): Generator<T> {
  if (
    model.selectMode.type === "multi-select" &&
    model.selectMode.selectedItemListDirection === "right-to-left"
  ) {
    for (const selectedItem of sortSelectedItems(config, model)) {
      yield selectedItem;
    }
    return;
  }

  yield* yieldReverse(sortSelectedItems(config, model));
};

/**
 * @group Selectors
 *
 * This function returns the selected item
 */
export const toSelectedItem = <T>(
  config: Config<T>,
  model: Model<T>
): T | null => {
  for (const selectedItem of yieldSelectedItems(config, model)) {
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
  config: Config<T>,
  model: Model<T>,
  item: T
): boolean => {
  for (const selectedItem of yieldSelectedItems(config, model)) {
    if (config.toItemId(selectedItem) === config.toItemId(item)) {
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
    case "focused-opened-highlighted": {
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
      yieldSelectedItems(config, model)
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
  return (
    model.type === "focused-opened-highlighted" && model.isKeyboardNavigation
  );
};

export type ItemStatusDetailed =
  | "selected"
  | "highlighted-with-keyboard"
  | "highlighted-with-mouse"
  | "selected-and-highlighted-with-keyboard"
  | "selected-and-highlighted-with-mouse"
  | "unselected";

export const toItemStatusDetailed = <T>(
  config: Config<T>,
  model: Model<T>,
  item: T
): ItemStatusDetailed => {
  const isSelected = isItemSelected(config, model, item);

  if (isSelected) {
    return "selected";
  }

  const isHighlighted = isItemHighlighted(config, model, item);
  const isKeyboardNavigation = isNavigatingWithKeyboard(model);

  if (isSelected && isHighlighted) {
    if (isKeyboardNavigation) {
      return "selected-and-highlighted-with-keyboard";
    }
    return "selected-and-highlighted-with-mouse";
  }

  if (isHighlighted) {
    if (isKeyboardNavigation) {
      return "highlighted-with-keyboard";
    }
    return "highlighted-with-mouse";
  }
  return "unselected";
};

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

export const yieldFilteredItems = function* <T>(
  config: Config<T>,
  model: Model<T>
): Generator<T> {
  //
  //
  //

  if (model.inputMode.type === "select-only") {
    let index = 0;
    for (const item of model.allItems) {
      if (index >= model.filteredItemLimit) {
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
      if (index >= model.filteredItemLimit) {
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
    if (index >= model.filteredItemLimit) {
      break;
    }
    yield item;
    index++;
  }
};

/**
 * @group Selectors
 *
 * This function returns the all the filtered items.
 */
export const toFilteredItems = <T>(config: Config<T>, model: Model<T>): T[] => {
  return Array.from(yieldFilteredItems(config, model));
};

/**
 * Get filtered items memoized
 */
export const toFilteredItemsMemoized = <T>(config: Config<T>) => {
  return memoize(
    config.filteredItemCache,
    (model) => {
      return config.deterministicFilterCacheKeyFn(model);
    },
    (model: Model<T>): T[] => {
      return toFilteredItems(config, model);
    }
  );
};

/**
 * @group Selectors
 *
 * This function returns the all the filtered items with their status.
 */
type RenderItem<T> = {
  item: T;
  status: ItemStatus;
  inputValue: string;
  aria: ReturnType<typeof ariaItem>;
};
export const yieldRenderItemsMemoized = function* <T>(
  config: Config<T>,
  model: Model<T>
): Generator<RenderItem<T>> {
  const selectedItemIdSet = new Set<string | number>();
  for (const item of yieldSelectedItems(config, model)) {
    selectedItemIdSet.add(config.toItemId(item));
  }

  const highlightedIndex =
    model.type === "focused-opened-highlighted" ? model.highlightIndex : null;

  let index = 0;

  for (const item of toFilteredItemsMemoized(config)(model)) {
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
 * @group Selectors
 *
 * This function returns the all the filtered items with their status.
 */
export const yieldRenderItems = function* <T>(
  config: Config<T>,
  model: Model<T>
): Generator<RenderItem<T>> {
  const selectedItemIdSet = new Set<string | number>();
  for (const item of yieldSelectedItems(config, model)) {
    selectedItemIdSet.add(config.toItemId(item));
  }

  const highlightedIndex =
    model.type === "focused-opened-highlighted" ? model.highlightIndex : null;

  let index = 0;

  for (const item of toFilteredItems(config, model)) {
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

export const toRenderItemsMemozied = <T>(
  config: Config<T>,
  model: Model<T>
): RenderItem<T>[] => {
  return Array.from(yieldRenderItemsMemoized(config, model));
};

export const toRenderItems = <T>(
  config: Config<T>,
  model: Model<T>
): RenderItem<T>[] => {
  return Array.from(yieldRenderItems(config, model));
};
/**
 * @group Selectors
 *
 * This function returns the all the filtered items with their status.
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
  for (const item of yieldSelectedItems(config, model)) {
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

    renderItems: toRenderItemsMemozied(config, model),
    renderSelectedItems: toRenderSelectedItems(config, model),
    isOpened: isOpened(model),
    selectedItems: toSelectedItems(config, model),
    inputValue: toCurrentInputValue(config, model),
    isBlurred: isBlurred(model),
    isFocused: isFocused(model),
    selectedItem: toSelectedItem(config, model),
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
