import {
  aria,
  ariaItem,
  ariaSelectedItem,
  ariaUnselectButton,
} from "./combobox-wai-aria";
import { isNonEmpty, type NonEmpty } from "./non-empty";
import {
  circularIndex,
  clampIndex,
  findIndex,
  intersectionLeft,
  keepIf,
  removeFirst,
  yieldIntersectionLeft,
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
  deterministicFilter: (model: Model<T>) => Generator<T, void, unknown>;
  isEmptyItem: (value: T) => boolean;
  namespace: string;
};

/**
 * @group Config
 */
export const initConfig = <T>({
  namespace,
  isEmptyItem = () => false,
  ...config
}: {
  toItemId: (item: T) => string | number;
  toItemInputValue: (item: T) => string;
  isEmptyItem?: (item: T) => boolean;
  deterministicFilter?: (model: Model<T>) => T[];
  namespace?: string;
}): Config<T> => {
  const configFull: Config<T> = {
    ...config,
    isEmptyItem,
    namespace: namespace ?? "combobox",
    deterministicFilter: function* (model) {
      for (const item of model.allItems) {
        yield item;
      }
    },
  };
  return {
    ...configFull,
    deterministicFilter: (model) => simpleFilter(configFull, model),
  };
};

/**
 * @group Config
 *
 * The simpleFilter function is a default implementation of the deterministicFilter function.
 */
export const simpleFilter = function* <T>(config: Config<T>, model: Model<T>) {
  for (let i = 0; i < model.allItems.length; i++) {
    const item = model.allItems[i];

    if (!item) {
      continue;
    }

    if (
      config
        .toItemInputValue(item)
        .toLowerCase()
        .includes(toCurrentInputValue(config, model).toLowerCase())
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
  allItems: T[];
  selectedItems: T[];
  skipOnce: Msg<T>["type"][];
  selectMode: SelectMode;
  inputMode: InputMode;
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
      hasSearched: boolean;
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
}: {
  allItems: T[];
  selectMode?: SelectMode;
  inputMode?: InputMode;
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
 * @group Update
 *
 * The update function is the main function.
 * The update function takes the current state of the combobox and a message and returns the new state of the
 * combobox and effects that need to be run.
 */
export const update = <T>(
  config: Config<T>,
  input: {
    model: Model<T>;
    msg: Msg<T>;
  }
): {
  model: Model<T>;
  effects: Effect<T>[];
  events: Event[];
} => {
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

  let output: {
    model: Model<T>;
    effects: Effect<T>[];
    events: Event[];
  } = {
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
  if (input.msg.type === "pressed-input" && isBlurred(output.model)) {
    output.effects.push({
      type: "focus-input",
    });
  }

  // scroll highlighted item into view when navigating with keyboard
  if (
    isHighlighted(output.model) &&
    input.msg.type === "pressed-vertical-arrow-key"
  ) {
    const visible = toVisibleItems(config, output.model);

    const highlightedItem = visible[output.model.highlightIndex];

    if (highlightedItem) {
      output.effects.push({
        type: "scroll-item-into-view",
        item: highlightedItem,
      });
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

   ⚠️ Edge case

   ⏱ Happens when:
   Dropdown transitions from closed to open state and the mouse is hovering where the the dropdown renders.

   🤔 Expected Behavior:
   The state is in an opened but not highlighted state.

   😑 Actual Behavior:
   The state is opened then an unwanted hover message changes the state to a highlighted state.

   */
  if (
    isClosed(input.model) &&
    isOpened(output.model) &&
    output.effects.some((effect) => effect.type === "scroll-item-into-view")
  ) {
    output.model = {
      ...output.model,
      skipOnce: ["hovered-over-item", "hovered-over-item"],
    };
  }

  if (isClosed(input.model) && isOpened(output.model)) {
    output.model = {
      ...output.model,
      skipOnce: [...output.model.skipOnce, "hovered-over-item"],
    };
  }

  /**

   ⚠️ Edge case

   ⏱ Happens when:
   Hovering over an item with the mouse and then scrolling to the next item with the keyboard.

   🤔 Expected Behavior:
   The item the keyboard navigated to is scrolled into view.

   😑 Actual Behavior:
   The item that was hovered over is scrolled into view.

   */
  if (
    output.effects.some((effect) => effect.type === "scroll-item-into-view")
  ) {
    output.model = { ...output.model, skipOnce: ["hovered-over-item"] };
  }

  /**

   ⚠️ Edge case

   ⏱ Happens when:
   Pressing input when the input is blurred

   🤔 Expected Behavior:
   The the suggestion drop down opens

   😑 Actual Behavior:
   Two events fire. input focused then input pressed. This causes the suggestion drop down to open and then close.

   */
  if (isBlurred(input.model) && isFocused(output.model)) {
    output.model = {
      ...output.model,
      skipOnce: [
        ...output.model.skipOnce.filter((x) => x !== "pressed-input"),
        "pressed-input",
      ],
    };
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
    return {
      ...model,
      allItems: msg.allItems,
    };
  }

  if (msg.type === "set-selected-items") {
    return {
      ...model,
      //
      // Important that selectedItems is a subset of allItems! Else it will cause infinite loop for consumers of the library!
      //
      selectedItems: intersectionLeft(
        config.toItemId,
        msg.selectedItems,
        model.allItems
      ),
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
        case "focused-input": {
          return resetInputValue(config, {
            ...model,
            type: "focused__opened",
          });
        }

        case "pressed-unselect-all-button": {
          return {
            ...model,
            selectedItems: [],
          };
        }

        case "pressed-unselect-button": {
          return removeFromSelected({
            config,
            model,
            item: msg.item,
          });
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "selected-item-highlighted",
            focusedIndex: toSelectedItems(model).findIndex(
              (item) => toItemId(item) === toItemId(msg.item)
            ),
          };
        }

        default: {
          return model;
        }
      }
    }

    case "focused__closed": {
      switch (msg.type) {
        case "pressed-input": {
          return closedToOpened(model);
        }

        case "blurred-input": {
          return focusedToBlurred(model);
        }

        case "inputted-value": {
          if (model.inputMode.type === "select-only") {
            return resetInputValue(config, closedToOpened(model));
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
          return resetInputValue(config, closedToOpened(model));
        }

        case "pressed-vertical-arrow-key": {
          if (model.selectMode.type === "single-select") {
            return resetInputValue(config, closedToOpened(model));
          }

          const selectedItemIndex = toSelectedItemIndex(config, model);

          return {
            ...closedToOpened(model),
            highlightIndex: selectedItemIndex ? selectedItemIndex : 0,
            type: "focused__opened__highlighted",
          };
        }

        case "pressed-horizontal-arrow-key": {
          return updateKeyboardNavigationForSelections({ model, msg });
        }

        case "pressed-unselect-button": {
          return removeFromSelected({
            config,
            model,
            item: msg.item,
          });
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "selected-item-highlighted",
            focusedIndex: toSelectedItems(model).findIndex(
              (item) => toItemId(item) === toItemId(msg.item)
            ),
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
        case "hovered-over-item": {
          return {
            ...model,
            type: "focused__opened__highlighted",
            highlightIndex: msg.index,
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
            return resetInputValue(config, model);
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
          return resetInputValue(config, {
            ...model,
            type: "focused__closed",
          });
        }

        case "pressed-vertical-arrow-key": {
          const visible = toVisibleItems(config, model);

          const selectedIndex = visible.findIndex((item) =>
            toSelectedItems(model).some((x) => toItemId(item) === toItemId(x))
          );

          if (selectedIndex === -1) {
            return {
              ...model,
              highlightIndex: 0,
              type: "focused__opened__highlighted",
            };
          }

          const delta =
            model.selectMode.type === "multi-select"
              ? 0
              : msg.key === "arrow-down"
              ? 1
              : -1;

          const highlightIndex = circularIndex(
            selectedIndex + delta,
            visible.length
          );

          return {
            ...model,
            highlightIndex,
            type: "focused__opened__highlighted",
          };
        }

        case "pressed-escape-key": {
          return {
            ...model,
            type: "focused__closed",
          };
        }

        case "pressed-horizontal-arrow-key": {
          return updateKeyboardNavigationForSelections({ model, msg });
        }

        case "pressed-unselect-button": {
          return removeFromSelected({
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
        case "hovered-over-item": {
          return { ...model, highlightIndex: msg.index };
        }

        case "blurred-input": {
          return focusedToBlurred(model);
        }

        case "pressed-item": {
          const pressedItem = msg.item;

          if (config.isEmptyItem(pressedItem)) {
            return {
              ...model,
              selectedItems: [],
              type: "focused__closed",
            };
          }

          if (model.selectMode.type === "multi-select") {
            const modelNew = toggleSelected({
              config,
              model: {
                ...model,
                type: "focused__closed",
              },
              item: msg.item,
            });

            return resetInputValue(config, modelNew);
          }

          if (!isItemSelected(config, model, pressedItem)) {
            const modelNew = addSelected({
              model: {
                ...model,
                type: "focused__closed",
              },
              item: pressedItem,
              config,
            });

            return resetInputValue(config, modelNew);
          }

          return {
            ...model,
            type: "focused__closed",
          };
        }

        case "pressed-input": {
          return handlePressedInputWhenOpened(model);
        }

        case "inputted-value": {
          if (model.inputMode.type === "select-only") {
            return resetInputValue(config, {
              ...model,
              type: "focused__opened",
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
          const visible = toVisibleItems(config, model);
          const delta = msg.key === "arrow-down" ? 1 : -1;
          const highlightIndex = circularIndex(
            model.highlightIndex + delta,
            visible.length
          );
          return { ...model, highlightIndex: highlightIndex };
        }

        case "pressed-horizontal-arrow-key": {
          return updateKeyboardNavigationForSelections({ model, msg });
        }

        case "pressed-enter-key": {
          const visible = toVisibleItems(config, model);

          const enteredItem = visible[model.highlightIndex];

          if (!enteredItem) {
            return { ...model, type: "focused__closed" };
          }

          if (config.isEmptyItem(enteredItem)) {
            return {
              ...model,
              selectedItems: [],
              type: "focused__closed",
            };
          }

          if (model.selectMode.type === "single-select") {
            const modelNew = addSelected({
              model: {
                ...model,
                type: "focused__closed",
              },
              item: enteredItem,
              config,
            });

            return resetInputValue(config, modelNew);
          }

          if (!isItemSelected(config, model, enteredItem)) {
            return clearInputValue(
              addSelected({
                model: {
                  ...model,
                  type: "focused__closed",
                },
                item: enteredItem,
                config,
              })
            );
          }

          return clearInputValue(
            removeFromSelected({
              model: {
                ...model,
                type: "focused__closed",
              },
              config,
              item: enteredItem,
            })
          );
        }

        case "pressed-escape-key": {
          return { ...model, type: "focused__closed" };
        }

        case "pressed-unselect-button": {
          const removed = toSelectedItems(model).filter(
            (x) => toItemId(x) !== toItemId(msg.item)
          );

          return { ...model, selectedItems: removed };
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "selected-item-highlighted",
            focusedIndex: toSelectedItems(model).findIndex(
              (item) => toItemId(item) === toItemId(msg.item)
            ),
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
            return resetInputValue(config, {
              ...model,
              type: "focused__opened",
            });
          }

          const selectedItemIndex = toSelectedItemIndex(config, model);

          return resetInputValue(config, {
            ...model,
            highlightIndex: selectedItemIndex ? selectedItemIndex : 0,
            type: "focused__opened__highlighted",
          });
        }

        case "inputted-value": {
          if (model.inputMode.type === "select-only") {
            return setInputValue(
              {
                ...model,

                type: "focused__opened",
              },
              modelToInputValue(config, model)
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
          return clearInputValue({
            ...model,
            type: "focused__closed",
          });
        }

        case "pressed-backspace-key": {
          const removedHighlightedIndex = toSelectedItems(model).filter(
            (_, index) => index !== model.focusedIndex
          );

          return clearInputValue({
            ...model,
            selectedItems: removedHighlightedIndex,
            type: "focused__closed",
          });
        }

        case "pressed-unselect-button": {
          const removed = toSelectedItems(model).filter(
            (x) => toItemId(x) !== toItemId(msg.item)
          );
          if (isNonEmpty(removed)) {
            const selectedItemHighlightIndex = clampIndex(
              model.focusedIndex,
              removed.length
            );
            return {
              ...model,
              selectedItems: removed,
              focusedIndex: selectedItemHighlightIndex,
            };
          }
          return clearInputValue({
            ...model,
            selectedItems: removed,
            type: "focused__closed",
          });
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "selected-item-highlighted",
            focusedIndex: toSelectedItems(model).findIndex(
              (item) => toItemId(item) === toItemId(msg.item)
            ),
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

const toggleSelected = <T>({
  config,
  model,
  item,
}: {
  config: Config<T>;
  model: Model<T>;
  item: T;
}): Model<T> => {
  if (!isItemSelected(config, model, item)) {
    const modelNew = addSelected({
      config,
      item,
      model: {
        ...model,
        type: "focused__closed",
      },
    });
    return resetInputValue(config, modelNew);
  }

  const modelNew: Model<T> = {
    ...model,
    type: "focused__closed",
    selectedItems: toSelectedItems(model).filter(
      (x) => config.toItemId(x) !== config.toItemId(item)
    ),
  };

  return resetInputValue(config, modelNew);
};

const toSelectedItemIndex = <T>(
  config: Config<T>,
  model: Model<T>
): number | null => {
  const selectedIndex = toVisibleItems(config, model).findIndex((item) =>
    toSelectedItems(model).some(
      (x) => config.toItemId(item) === config.toItemId(x)
    )
  );
  return selectedIndex === -1 ? null : selectedIndex;
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

const clearInputValue = <T>(model: Model<T>): Model<T> => {
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
    yieldIntersectionLeft(
      config.toItemId,
      yieldUnique(config.toItemId, [item, ...model.selectedItems]),
      model.allItems
    )
  );

  return {
    ...model,
    selectedItems: selectedItemsNew,
  };
};

const removeFromSelected = <T>({
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

const updateKeyboardNavigationForSelections = <T>({
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

export const resetInputValue = <T>(
  config: Config<T>,
  model: Model<T>
): Model<T> => {
  return setInputValue(model, modelToInputValue(config, model));
};

const modelToInputValue = <T>(config: Config<T>, model: Model<T>): string => {
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
    const emptyItem = model.allItems.find((item) => config.isEmptyItem(item));
    const selectedItem = toSelectedItem(model);
    if (selectedItem) {
      return config.toItemInputValue(selectedItem);
    }

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
    return modelToInputValue(config, model);
  }

  if (model.type === "blurred") {
    return modelToInputValue(config, model);
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
  switch (model.type) {
    case "focused__opened__highlighted": {
      const item = toVisibleItems(config, model)[model.highlightIndex];

      return item ?? null;
    }
    default: {
      return null;
    }
  }
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
  const selectedItems = toSelectedItems(model);
  if (isNonEmpty(selectedItems)) {
    return selectedItems[0];
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
  return toSelectedItems(model).some((x) => toItemId(x) === toItemId(item));
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
  if (isItemSelectedAndHighlighted(config, model, item)) {
    return "selected-and-highlighted";
  }

  if (isItemSelected(config, model, item)) {
    return "selected";
  }

  if (isItemHighlighted(config, model, item)) {
    return "highlighted";
  }

  return "unselected";
};

export const yieldVisibleItems = function* <T>(
  config: Config<T>,
  model: Model<T>
): Generator<T> {
  if (model.inputMode.type === "select-only") {
    for (const item of model.allItems) {
      yield item;
    }
    return;
  }

  if (model.inputMode.type === "search-mode" && !model.inputMode.hasSearched) {
    for (const item of model.allItems) {
      yield item;
    }
    return;
  }

  yield* config.deterministicFilter(model);
};

/**
 * @group Selectors
 *
 * This function returns the all the visible items.
 */
export const toVisibleItems = <T>(config: Config<T>, model: Model<T>): T[] => {
  return Array.from(yieldVisibleItems(config, model));
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
  for (const item of yieldVisibleItems(config, model)) {
    yield {
      item,
      status: toItemStatus(config, model, item),
      inputValue: config.toItemInputValue(item),
      aria: ariaItem(config, model, item),
    };
  }
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
    visibleItems: toVisibleItems(config, model),
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
