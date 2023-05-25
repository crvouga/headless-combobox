import { removeFirst } from "./helpers";
import { isNonEmpty, type NonEmpty } from "./non-empty";
import { aria } from "./wai-aria";

/** @module Config **/

/**
 * @group Config
 *
 * The Config<TItem> represents the configuration needed for the combobox to work with generic items.
 * @remark
 * ⚠️ All these functions should be deterministic!
 */
export type Config<TItem> = {
  toItemId: (item: TItem) => string | number;
  toItemInputValue: (item: TItem) => string;
  deterministicFilter: (model: Model<TItem>) => TItem[];
  isEmptyItem: (value: TItem) => boolean;
  namespace: string;
};

/**
 * @group Config
 */
export const initConfig = <TItem>({
  namespace,
  isEmptyItem = () => false,
  ...config
}: {
  toItemId: (item: TItem) => string | number;
  toItemInputValue: (item: TItem) => string;
  isEmptyItem?: (item: TItem) => boolean;
  deterministicFilter?: (model: Model<TItem>) => TItem[];
  namespace?: string;
}): Config<TItem> => {
  const configFull: Config<TItem> = {
    ...config,
    isEmptyItem,
    namespace: namespace ?? "combobox",
    deterministicFilter: (model) => model.allItems,
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
export const simpleFilter = <TItem>(
  config: Config<TItem>,
  model: Model<TItem>
) => {
  return model.allItems.filter((item) =>
    config
      .toItemInputValue(item)
      .toLowerCase()
      .includes(toCurrentInputValue(config, model).toLowerCase())
  );
};

/** @module Model **/

/**
 * @group Model
 * The Model<TItem> represents the state of the combobox.
 * This is the data you will be saving in your app.
 */
export type Model<TItem> = ModelState<TItem> & {
  allItems: TItem[];
  selections: TItem[];
  skipOnce: Msg<TItem>["type"][];
  selectMode: SelectMode;
  inputMode: InputMode;
};

/**
 * @group Model
 *
 * The SelectMode represents what kind of selection the combobox is doing.
 */
export type SelectMode =
  | {
      type: "single-select";
    }
  | {
      type: "multi-select";
      selectionsDirection: selectionsDirection;
    };

export type selectionsDirection = "left-to-right" | "right-to-left";

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
    };

type Blurred<TItem> = {
  type: "blurred";
};

type FocusedClosed<TItem> = {
  type: "focused__closed";
  inputValue: string;
};

type FocusedOpened<TItem> = {
  type: "focused__opened";
  inputValue: string;
};

type FocusedOpenedHighlighted<TItem> = {
  type: "focused__opened__highlighted";
  inputValue: string;
  highlightIndex: number;
};

type SelectionHighlighted<TItem> = {
  type: "selection_highlighted";
  focusedIndex: number;
};

type ModelState<TItem> =
  | Blurred<TItem>
  | FocusedClosed<TItem>
  | FocusedOpened<TItem>
  | FocusedOpenedHighlighted<TItem>
  | SelectionHighlighted<TItem>;

/**
 * @group Model
 *
 * The init function returns the initial state of the combobox.
 */
export const init = <TItem>({
  allItems,
  selectMode,
  inputMode,
}: {
  allItems: TItem[];
  selectMode?: SelectMode;
  inputMode?: InputMode;
}): Model<TItem> => {
  return {
    type: "blurred",
    selections: [],
    allItems,
    skipOnce: [],
    inputMode: inputMode ? inputMode : { type: "search-mode" },
    selectMode: selectMode ? selectMode : { type: "single-select" },
  };
};

/** @module Update **/

/**
 * @group Update
 *
 * The Msg<TItem> represents all the possible state transitions that can happen to the combobox.
 */
export type Msg<TItem> =
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
      item: TItem;
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
      item: TItem;
    }
  | {
      type: "focused-selected-item";
      item: TItem;
    }
  | {
      type: "blurred-selected-item";
      item: TItem;
    }
  //
  // Setters
  //
  | {
      type: "set-all-items";
      allItems: TItem[];
    }
  | {
      type: "set-selections";
      selections: TItem[];
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
 * The Effect<TItem> represents all the possible effects that can happen to the combobox.
 * You as the user of the library has to implement the side effects
 **/
export type Effect<TItem> =
  | {
      type: "scroll-item-into-view";
      item: TItem;
    }
  | {
      type: "focus-selected-item";
      item: TItem;
    }
  | {
      type: "focus-input";
    };

/**
 * @group Update
 *
 * The update function is the main function.
 * The update function takes the current state of the combobox and a message and returns the new state of the
 * combobox and effects that need to be run.
 */
export const update = <TItem>(
  config: Config<TItem>,
  {
    msg,
    model,
  }: {
    model: Model<TItem>;
    msg: Msg<TItem>;
  }
): {
  model: Model<TItem>;
  effects: Effect<TItem>[];
} => {
  /**
   *
   *
   *
   */
  if (model.skipOnce.includes(msg.type)) {
    return {
      model: {
        ...model,
        skipOnce: removeFirst((m) => m === msg.type, model.skipOnce),
      },
      effects: [],
    };
  }

  /**
   *
   *
   *
   */

  let output: {
    model: Model<TItem>;
    effects: Effect<TItem>[];
  } = {
    model,
    effects: [],
  };

  /**
   *
   * Update Model
   *
   */

  output.model = updateSetters({
    msg,
    model: updateModel(config, { msg, model }),
  });

  /**
   *
   * Add Effects
   *
   */

  // scroll to selected item into view when state changes from closed to opened
  if (isClosed(model) && isOpened(output.model) && isSelected(output.model)) {
    output.effects.push({
      type: "scroll-item-into-view",
      item: output.model.selections[0],
    });
  }

  // scroll highlighted item into view when navigating with keyboard
  if (
    isHighlighted(output.model) &&
    msg.type === "pressed-vertical-arrow-key"
  ) {
    const filtered = toVisibleItems(config, output.model);

    const highlightedItem = filtered[output.model.highlightIndex];

    if (highlightedItem) {
      output.effects.push({
        type: "scroll-item-into-view",
        item: highlightedItem,
      });
    }
  }

  // focus on selected item when highlighted
  if (isSelectionFocused(output.model)) {
    const selectedHighlightedItem =
      output.model.selections[output.model.focusedIndex];
    if (selectedHighlightedItem) {
      output.effects.push({
        type: "focus-selected-item",
        item: selectedHighlightedItem,
      });
    }
  }

  // focus on input when navigating selected items with keyboard
  if (isSelectionFocused(model) && !isSelectionFocused(output.model)) {
    output.effects.push({
      type: "focus-input",
    });
  }

  // focus on input after clearing selections
  if (msg.type === "pressed-unselect-all-button") {
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
    isClosed(model) &&
    isOpened(output.model) &&
    output.effects.some((effect) => effect.type === "scroll-item-into-view")
  ) {
    output.model = {
      ...output.model,
      skipOnce: ["hovered-over-item", "hovered-over-item"],
    };
  }

  if (isClosed(model) && isOpened(output.model)) {
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
  if (
    (isBlurred(model) || model.type === "selection_highlighted") &&
    isFocused(output.model)
  ) {
    output.model = {
      ...output.model,
      skipOnce: [...output.model.skipOnce, "pressed-input"],
    };
  }

  return output;
};

const updateSetters = <TItem>({
  model,
  msg,
}: {
  model: Model<TItem>;
  msg: Msg<TItem>;
}): Model<TItem> => {
  if (msg.type === "set-all-items") {
    return {
      ...model,
      allItems: msg.allItems,
    };
  }

  if (msg.type === "set-selections") {
    if (isSelected(model)) {
      return {
        ...model,
        selections: msg.selections,
      };
    }
    return {
      ...model,
      type: "blurred",
      selections: msg.selections,
    };
  }

  if (msg.type === "set-input-value") {
    if ("inputValue" in model) {
      return {
        ...model,
        inputValue: msg.inputValue,
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
  const { toItemInputValue, toItemId } = config;
  switch (model.type) {
    case "blurred": {
      switch (msg.type) {
        case "focused-input": {
          return {
            ...model,
            type: "focused__opened",
            inputValue: modelToInputValue(config, model),
            selections: model.selections,
          };
        }

        case "pressed-unselect-all-button": {
          return {
            ...model,
            type: "blurred",
          };
        }

        case "pressed-unselect-button": {
          const removed = model.selections.filter(
            (selection) => toItemId(selection) !== toItemId(msg.item)
          );
          if (isNonEmpty(removed)) {
            return { ...model, selections: removed };
          }
          return { ...model, type: "blurred" };
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "selection_highlighted",
            focusedIndex: model.selections.findIndex(
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
          return { ...model, type: "focused__opened" };
        }

        case "blurred-input": {
          return { ...model, type: "blurred" };
        }

        case "inputted-value": {
          if (model.inputMode.type === "select-only") {
            return {
              ...model,
              inputValue: modelToInputValue(config, model),
              type: "focused__opened",
            };
          }
          if (
            msg.inputValue === "" &&
            model.selectMode.type === "single-select"
          ) {
            return {
              ...model,
              inputValue: msg.inputValue,
              type: "focused__opened",
            };
          }
          return {
            ...model,
            inputValue: msg.inputValue,
            type: "focused__opened",
          };
        }

        case "pressed-enter-key": {
          return {
            ...model,
            inputValue: modelToInputValue(config, model),
            type: "focused__opened",
          };
        }

        case "pressed-vertical-arrow-key": {
          return {
            ...model,
            inputValue: modelToInputValue(config, model),
            type: "focused__opened",
          };
        }

        case "pressed-horizontal-arrow-key": {
          return updateKeyboardNavigationForSelections({ model, msg });
        }

        case "pressed-unselect-button": {
          const removed = model.selections.filter(
            (selection) => toItemId(selection) !== toItemId(msg.item)
          );
          if (isNonEmpty(removed)) {
            return { ...model, selections: removed };
          }
          return { ...model, type: "focused__closed" };
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "selection_highlighted",
            focusedIndex: model.selections.findIndex(
              (item) => toItemId(item) === toItemId(msg.item)
            ),
          };
        }

        case "pressed-backspace-key": {
          if (
            model.inputMode.type === "select-only" &&
            model.selectMode.type === "single-select"
          ) {
            return { ...model, type: "focused__opened", selections: [] };
          }

          if (model.inputValue === "") {
            const removed = model.selections.slice(1);
            if (isNonEmpty(removed)) {
              return { ...model, selections: removed };
            }
            return { ...model, type: "focused__opened" };
          }
          return model;
        }

        case "pressed-unselect-all-button": {
          return {
            ...model,
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
          return {
            ...model,
            type: "blurred",
            selections: model.selections,
          };
        }

        case "pressed-input": {
          return {
            ...model,
            type: "focused__closed",
          };
        }

        case "pressed-item": {
          const pressedItem = msg.item;

          if (config.isEmptyItem(pressedItem)) {
            return {
              ...model,
              type: "focused__closed",
            };
          }

          const modelNew = toggleSelected({
            config,
            item: pressedItem,
            model,
          });

          return {
            ...modelNew,
            // inputValue: modelToInputValue(config, modelNew),
          };
        }

        case "inputted-value": {
          if (model.inputMode.type === "select-only") {
            return {
              ...model,
              inputValue: modelToInputValue(config, model),
              type: "focused__opened",
            };
          }

          if (
            msg.inputValue === "" &&
            model.selectMode.type === "single-select"
          ) {
            return {
              ...model,
              inputValue: "",
              type: "focused__opened",
            };
          }
          return { ...model, inputValue: msg.inputValue };
        }

        case "pressed-enter-key": {
          return {
            ...model,
            inputValue: modelToInputValue(config, model),
            type: "focused__closed",
          };
        }

        case "pressed-vertical-arrow-key": {
          const filtered = toVisibleItems(config, model);

          const selectedIndex = filtered.findIndex((item) =>
            model.selections.some(
              (selection) => toItemId(item) === toItemId(selection)
            )
          );

          if (selectedIndex === -1) {
            return {
              ...model,
              highlightIndex: 0,
              type: "focused__opened__highlighted",
            };
          }

          const delta = msg.key === "arrow-down" ? 1 : -1;

          const highlightIndex = circularIndex(
            selectedIndex + delta,
            filtered.length
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
          const removed = model.selections.filter(
            (selection) => toItemId(selection) !== toItemId(msg.item)
          );
          if (isNonEmpty(removed)) {
            return { ...model, selections: removed };
          }
          return { ...model, type: "focused__opened" };
        }

        case "pressed-backspace-key": {
          if (
            model.inputMode.type === "select-only" &&
            model.selectMode.type === "single-select"
          ) {
            return { ...model, selections: [] };
          }

          if (model.inputValue === "") {
            const removed = model.selections.slice(1);
            if (isNonEmpty(removed)) {
              return { ...model, selections: removed };
            }
            return { ...model, type: "focused__opened" };
          }
          return model;
        }

        case "pressed-unselect-all-button": {
          return {
            ...model,
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
          return { ...model, type: "blurred" };
        }

        case "pressed-item": {
          const pressedItem = msg.item;

          if (config.isEmptyItem(pressedItem)) {
            return {
              ...model,
              type: "focused__closed",
            };
          }

          if (model.selectMode.type === "single-select") {
            const modelNew: Model<T> = {
              ...model,
              type: "focused__closed",
              selections: addSelected(
                model.selectMode,
                pressedItem,
                model.selections
              ),
            };
            return {
              ...modelNew,
              inputValue: modelToInputValue(config, modelNew),
            };
          }

          if (!isItemSelected(config, model, pressedItem)) {
            const modelNew: Model<T> = {
              ...model,
              type: "focused__closed",
              selections: addSelected(
                model.selectMode,
                pressedItem,
                model.selections
              ),
            };
            return {
              ...modelNew,
              inputValue: modelToInputValue(config, modelNew),
            };
          }

          const removed = model.selections.filter(
            (selection) => toItemId(selection) !== toItemId(pressedItem)
          );

          if (isNonEmpty(removed)) {
            return {
              ...model,
              type: "focused__closed",
              selections: removed,
            };
          }

          return {
            ...model,
            type: "focused__closed",
          };
        }

        case "inputted-value": {
          if (model.inputMode.type === "select-only") {
            return {
              ...model,
              inputValue: modelToInputValue(config, model),
              type: "focused__opened",
            };
          }
          if (
            msg.inputValue === "" &&
            model.selectMode.type === "single-select"
          ) {
            return {
              ...model,
              inputValue: "",
              selections: [],
              type: "focused__opened",
            };
          }
          return { ...model, inputValue: msg.inputValue };
        }

        case "pressed-vertical-arrow-key": {
          const filtered = toVisibleItems(config, model);
          const delta = msg.key === "arrow-down" ? 1 : -1;
          const highlightIndex = circularIndex(
            model.highlightIndex + delta,
            filtered.length
          );
          return { ...model, highlightIndex: highlightIndex };
        }

        case "pressed-horizontal-arrow-key": {
          return updateKeyboardNavigationForSelections({ model, msg });
        }

        case "pressed-enter-key": {
          const filtered = toVisibleItems(config, model);

          const enteredItem = filtered[model.highlightIndex];

          if (!enteredItem) {
            return { ...model, type: "focused__closed" };
          }

          if (config.isEmptyItem(enteredItem)) {
            return {
              ...model,
              type: "focused__closed",
            };
          }

          if (model.selectMode.type === "single-select") {
            return {
              ...model,
              inputValue: toItemInputValue(enteredItem),
              selections: addSelected(
                model.selectMode,
                enteredItem,
                model.selections
              ),
              type: "focused__closed",
            };
          }

          if (!isItemSelected(config, model, enteredItem)) {
            return {
              ...model,
              inputValue: "",
              selections: addSelected(
                model.selectMode,
                enteredItem,
                model.selections
              ),
              type: "focused__closed",
            };
          }

          const removed = model.selections.filter(
            (selection) => toItemId(selection) !== toItemId(enteredItem)
          );

          if (isNonEmpty(removed)) {
            return {
              ...model,
              inputValue: "",
              selections: removed,
              type: "focused__closed",
            };
          }

          return {
            ...model,
            inputValue: "",
            type: "focused__closed",
          };
        }

        case "pressed-escape-key": {
          return { ...model, type: "focused__closed" };
        }

        case "pressed-unselect-button": {
          const removed = model.selections.filter(
            (selection) => toItemId(selection) !== toItemId(msg.item)
          );
          if (isNonEmpty(removed)) {
            return { ...model, selections: removed };
          }
          return { ...model, type: "focused__opened__highlighted" };
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "selection_highlighted",
            focusedIndex: model.selections.findIndex(
              (item) => toItemId(item) === toItemId(msg.item)
            ),
          };
        }

        case "pressed-backspace-key": {
          if (model.inputValue === "") {
            const removed = model.selections.slice(1);
            if (isNonEmpty(removed)) {
              return { ...model, selections: removed };
            }
            return { ...model, type: "focused__opened" };
          }
          return model;
        }

        case "pressed-unselect-all-button": {
          return {
            ...model,
            type: "focused__opened",
          };
        }

        default: {
          return model;
        }
      }
    }

    case "selection_highlighted": {
      switch (msg.type) {
        case "pressed-horizontal-arrow-key": {
          if (model.selectMode.type !== "multi-select") {
            return {
              ...model,
              inputValue: "",
              type: "focused__closed",
            };
          }

          if (
            model.focusedIndex === 0 &&
            model.selectMode.selectionsDirection === "right-to-left" &&
            msg.key === "arrow-right"
          ) {
            return {
              ...model,
              inputValue: "",
              type: "focused__closed",
            };
          }

          if (
            model.focusedIndex === 0 &&
            model.selectMode.selectionsDirection === "left-to-right" &&
            msg.key === "arrow-left"
          ) {
            return {
              ...model,
              inputValue: "",
              type: "focused__closed",
            };
          }

          const delta =
            model.selectMode.selectionsDirection === "right-to-left"
              ? msg.key === "arrow-right"
                ? -1
                : 1
              : model.selectMode.selectionsDirection === "left-to-right"
              ? msg.key === "arrow-left"
                ? -1
                : 1
              : 0;

          const selectedItemHighlightIndexNew = clampIndex(
            model.focusedIndex + delta,
            model.selections.length
          );
          return {
            ...model,
            focusedIndex: selectedItemHighlightIndexNew,
          };
        }

        case "pressed-vertical-arrow-key": {
          return {
            ...model,
            inputValue: "",
            type: "focused__opened",
          };
        }

        case "inputted-value": {
          if (model.inputMode.type === "select-only") {
            return {
              ...model,
              inputValue: modelToInputValue(config, model),
              type: "focused__opened",
            };
          }
          if ("inputValue" in model && model.inputValue === "") {
            return {
              ...model,
              inputValue: msg.inputValue,
              selections: [],
              type: "focused__opened",
            };
          }
          return {
            ...model,
            inputValue: msg.inputValue,
            type: "focused__opened",
          };
        }

        case "pressed-key":
        case "pressed-enter-key":
        case "pressed-escape-key": {
          return {
            ...model,
            inputValue: "",
            type: "focused__closed",
          };
        }

        case "pressed-backspace-key": {
          const removedHighlightedIndex = model.selections.filter(
            (_, index) => index !== model.focusedIndex
          );

          if (isNonEmpty(removedHighlightedIndex)) {
            return {
              ...model,
              selections: removedHighlightedIndex,
              inputValue: "",
              type: "focused__closed",
            };
          }

          return {
            ...model,
            inputValue: "",
            type: "focused__closed",
          };
        }

        case "pressed-unselect-button": {
          const removed = model.selections.filter(
            (selection) => toItemId(selection) !== toItemId(msg.item)
          );
          if (isNonEmpty(removed)) {
            const selectedItemHighlightIndex = clampIndex(
              model.focusedIndex,
              removed.length
            );
            return {
              ...model,
              selections: removed,
              focusedIndex: selectedItemHighlightIndex,
            };
          }
          return {
            ...model,
            inputValue: "",
            type: "focused__closed",
          };
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "selection_highlighted",
            focusedIndex: model.selections.findIndex(
              (item) => toItemId(item) === toItemId(msg.item)
            ),
          };
        }

        case "blurred-selected-item": {
          return model;
        }

        case "focused-input": {
          return {
            ...model,
            inputValue: "",
            type: "focused__opened",
          };
        }

        case "pressed-unselect-all-button": {
          return {
            ...model,
            inputValue: "",
            type: "focused__opened",
          };
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

const toggleSelected = <T>({
  config,
  model,
  item,
}: {
  config: Config<T>;
  model: Model<T>;
  item: T;
}): Model<T> => {
  if (!isSelected(model)) {
    return model;
  }

  if (model.selectMode.type === "single-select") {
    const modelNew: Model<T> = {
      ...model,
      inputValue: "",
      type: "focused__closed",
      selections: addSelected(model.selectMode, item, model.selections),
    };
    return {
      ...modelNew,
      inputValue: modelToInputValue(config, modelNew),
    };
  }

  if (!isItemSelected(config, model, item)) {
    const modelNew: Model<T> = {
      ...model,
      inputValue: "",
      type: "focused__closed",
      selections: addSelected(model.selectMode, item, model.selections),
    };
    return {
      ...modelNew,
      inputValue: modelToInputValue(config, modelNew),
    };
  }

  const removed = model.selections.filter(
    (selection) => config.toItemId(selection) !== config.toItemId(item)
  );

  if (isNonEmpty(removed)) {
    return {
      ...model,
      inputValue: modelToInputValue(config, model),
      type: "focused__closed",
      selections: removed,
    };
  }

  return {
    ...model,
    inputValue: modelToInputValue(config, model),
    type: "focused__closed",
  };
};

const addSelected = <TItem>(
  mode: SelectMode,
  item: TItem,
  selections: TItem[]
): NonEmpty<TItem> => {
  if (mode.type === "single-select") {
    return [item];
  }
  const selectionsNew = [...selections, item];
  if (isNonEmpty(selectionsNew)) {
    return selectionsNew;
  }
  return [item];
};

const updateKeyboardNavigationForSelections = <T>({
  model,
  msg,
}: {
  model: Model<T> & FocusedState<T>;
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

  if ("inputValue" in model && model.inputValue !== "") {
    return model;
  }

  if (
    model.selectMode.selectionsDirection === "right-to-left" &&
    msg.key === "arrow-left"
  ) {
    return {
      ...model,
      type: "selection_highlighted",
      focusedIndex: 0,
    };
  }

  if (
    model.selectMode.selectionsDirection === "left-to-right" &&
    msg.key === "arrow-right"
  ) {
    return {
      ...model,
      type: "selection_highlighted",
      focusedIndex: 0,
    };
  }

  return model;
};

const modelToInputValue = <TItem>(
  config: Config<TItem>,
  model: Model<TItem>
): string => {
  if (
    model.inputMode.type === "select-only" &&
    model.selectMode.type === "multi-select"
  ) {
    return "";
  }

  if (model.inputMode.type === "select-only") {
    const emptyItem = model.allItems.find((item) => config.isEmptyItem(item));
    if (isSelected(model)) {
      return config.toItemInputValue(model.selections[0]);
    }
    if (isHighlighted(model)) {
      const item = model.allItems[model.highlightIndex];

      if (!item) {
        return emptyItem ? config.toItemInputValue(emptyItem) : "";
      }

      return config.toItemInputValue(item);
    }

    return emptyItem ? config.toItemInputValue(emptyItem) : "";
  }

  if (isSelected(model) && model.selectMode.type === "single-select") {
    return config.toItemInputValue(model.selections[0]);
  }

  return "";
};

const circularIndex = (index: number, length: number) => {
  if (length === 0) {
    return 0;
  }
  return ((index % length) + length) % length;
};

const clampIndex = (index: number, length: number) => {
  if (length === 0) {
    return 0;
  }
  return Math.min(Math.max(0, index), length - 1);
};

/** @module Selectors **/

/**
 * @group Selectors
 *
 * Utility function to determine if any item is selected.
 */
export const isSelected = <TItem>(
  model: Model<TItem>
): model is SelectedState<TItem> => {
  return isNonEmpty(model.selections);
};
export type SelectedState<T> = Model<T> & { selections: NonEmpty<T> };

/**
 * @group Selectors
 *
 * Utility function to determine if in unselected state
 */
export const isUnselected = <TItem>(
  model: ModelState<TItem>
): model is UnselectedState<TItem> => {
  return (
    model.type === "focused__opened" ||
    model.type === "focused__opened__highlighted" ||
    model.type === "blurred" ||
    model.type === "focused__closed"
  );
};
export type UnselectedState<TItem> = Exclude<
  ModelState<TItem>,
  SelectedState<TItem>
>;

/**
 * @group Selectors
 *
 * Utility function to determine if the dropdown is opened.
 */
export const isOpened = <TItem>(
  model: ModelState<TItem>
): model is OpenedState<TItem> => {
  return (
    model.type === "focused__opened" ||
    model.type === "focused__opened__highlighted"
  );
};
export type OpenedState<TItem> =
  | FocusedOpened<TItem>
  | FocusedOpenedHighlighted<TItem>;

/**
 * @group Selectors
 *
 * Utility function to determine if the dropdown is closed.
 */
export const isClosed = <TItem>(
  model: ModelState<TItem>
): model is ClosedState<TItem> => {
  return !isOpened(model);
};
export type ClosedState<TItem> = Exclude<ModelState<TItem>, OpenedState<TItem>>;

/**
 * @group Selectors
 *
 * Utility function to determine if any item is highlighted.
 */
export const isHighlighted = <TItem>(
  model: ModelState<TItem>
): model is HighlightedState<TItem> => {
  return model.type === "focused__opened__highlighted";
};

export type HighlightedState<TItem> = FocusedOpenedHighlighted<TItem>;

/**
 * @group Selectors
 *
 * Utility function to determine if input is blurred.
 */
export const isBlurred = <TItem>(
  model: ModelState<TItem>
): model is Blurred<TItem> => {
  return model.type === "blurred";
};
export type BlurredState<TItem> = Blurred<TItem>;

/**
 * @group Selectors
 *
 */
export const isSelectionFocused = <T>(
  model: ModelState<T>
): model is SelectionHighlighted<T> => {
  return model.type === "selection_highlighted";
};

/**
 * @group Selectors
 *
 * Utility function to determine if input is focused.
 */
export const isFocused = <TItem>(
  model: ModelState<TItem>
): model is FocusedState<TItem> => {
  return !isBlurred(model);
};
export type FocusedState<TItem> = Exclude<
  ModelState<TItem>,
  BlurredState<TItem>
>;

/**
 * @group Selectors
 *
 * This function returns the value that the input element should have.
 */
export const toCurrentInputValue = <TItem>(
  config: Config<TItem>,
  model: Model<TItem>
): string => {
  if (model.inputMode.type === "select-only") {
    return modelToInputValue(config, model);
  }

  if (model.type === "blurred") {
    return modelToInputValue(config, model);
  }

  if ("inputValue" in model) {
    return model.inputValue;
  }

  return "";
};

/**
 * @group Selectors
 *
 * This function returns the highlighted item.
 */
export const toHighlightedItem = <TItem>(
  config: Config<TItem>,
  model: Model<TItem>
): TItem | null => {
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
export const isItemHighlighted = <TItem>(
  config: Config<TItem>,
  model: Model<TItem>,
  item: TItem
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
export const toSelections = <TItem>(model: Model<TItem>): TItem[] => {
  return model.selections;
};

/**
 * @group Selectors
 *
 * This function returns the selected item
 */
export const toSelectedItem = <TItem>(model: Model<TItem>): TItem | null => {
  if (isNonEmpty(model.selections)) {
    return model.selections[0];
  }
  return null;
};

/**
 * @group Selectors
 *
 * Utility function to determine if an item is selected.
 */
export const isItemSelected = <TItem>(
  { toItemId }: Pick<Config<TItem>, "toItemId">,
  model: Model<TItem>,
  item: TItem
): boolean => {
  return model.selections.some(
    (selection) => toItemId(selection) === toItemId(item)
  );
};

/**
 * @group Selectors
 *
 * Selector function to determine if an index is selected.
 */
export const isItemIndexHighlighted = <TItem>(
  model: Model<TItem>,
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
export const isItemSelectedAndHighlighted = <TItem>(
  config: Config<TItem>,
  model: Model<TItem>,
  item: TItem
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
    isSelectionFocused(model) &&
    model.selections.findIndex(
      (item) => config.toItemId(item) === config.toItemId(selectedItem)
    ) === model.focusedIndex
  );
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
export const toItemStatus = <TItem>(
  config: Config<TItem>,
  model: Model<TItem>,
  item: TItem
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

/**
 * @group Selectors
 *
 * This function returns the all the visible items.
 */
export const toVisibleItems = <T>(config: Config<T>, model: Model<T>): T[] => {
  if (model.inputMode.type === "select-only") {
    return model.allItems;
  }
  return config.deterministicFilter(model);
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
): selectionsDirection | null => {
  if (model.selectMode.type === "multi-select") {
    return model.selectMode.selectionsDirection;
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
    isOpened: isOpened(model),
    selections: toSelections(model),
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
 *
 * @param updateOutput
 * @param handlers
 *
 *
 * Helper function to run effects with less boilerplate.
 */
export const runEffects = <T>(
  { effects }: { effects: Effect<T>[] },
  handlers: {
    scrollItemIntoView: (item: T) => void;
    focusInput: () => void;
    focusSelectedItem: (selectedIem: T) => void;
  }
) => {
  for (const effect of effects) {
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
    }
  }
};
