/** @module Config **/

import { aria } from "./wai-aria";

/**
 * @memberof Config
 * @description
 * The Config<TItem> represents the configuration needed for the combobox to work with generic items.
 * @remark
 * ⚠️ All these functions should be deterministic!
 */
export type Config<TItem> = {
  toItemId: (item: TItem) => string | number;
  toItemInputValue: (item: TItem) => string;
  deterministicFilter: (model: Model<TItem>) => TItem[];
  namespace: string;
};

/**
 * @memberof Config
 */
export const initConfig = <TItem>({
  namespace,
  ...config
}: {
  toItemId: (item: TItem) => string | number;
  toItemInputValue: (item: TItem) => string;
  deterministicFilter?: (model: Model<TItem>) => TItem[];
  namespace?: string;
}): Config<TItem> => {
  const configFull: Config<TItem> = {
    ...config,
    namespace: namespace ?? "combobox",
    deterministicFilter: (model) => model.allItems,
  };
  return {
    ...configFull,
    deterministicFilter: (model) => simpleFilter(configFull, model),
  };
};

/**
 * @memberof Config
 * @description
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
 * @memberof Model
 * @description
 * The Model<TItem> represents the state of the combobox.
 */
export type Model<TItem> = ModelState<TItem> & {
  allItems: TItem[];
  skipOnce: Msg<TItem>["type"][];
  mode: Mode;
};

/**
 * @memberof Model
 * @description
 * The Mode represents the mode of the combobox.
 * "You don't say? 😑" - probably you
 */
export type Mode =
  | {
      type: "single-select";
    }
  | {
      type: "multi-select";
    };

type UnselectedBlurred = {
  type: "unselected__blurred";
};

type UnselectedFocusedOpened = {
  type: "unselected__focused__opened";
  inputValue: string;
};

type UnselectedFocusedOpenedHighlighted = {
  type: "unselected__focused__opened__highlighted";
  inputValue: string;
  highlightIndex: number;
};

type UnselectedFocusedClosed = {
  type: "unselected__focused__closed";
  inputValue: string;
};

type SelectedBlurred<TItem> = {
  type: "selected__blurred";
  selected: NonEmpty<TItem>;
};

type SelectedFocusedClosed<TItem> = {
  type: "selected__focused__closed";
  inputValue: string;
  selected: NonEmpty<TItem>;
};

type SelectedFocusedOpened<TItem> = {
  type: "selected__focused__opened";
  selected: NonEmpty<TItem>;
  inputValue: string;
};

type SelectedFocusedOpenedHighlighted<TItem> = {
  type: "selected__focused__opened__highlighted";
  selected: NonEmpty<TItem>;
  inputValue: string;
  highlightIndex: number;
};

type SelectionFocused<TItem> = {
  type: "selection_focused";
  selected: NonEmpty<TItem>;
  focusedIndex: number;
};

type ModelState<TItem> =
  | UnselectedBlurred
  | UnselectedFocusedOpened
  | UnselectedFocusedOpenedHighlighted
  | UnselectedFocusedClosed
  | SelectedBlurred<TItem>
  | SelectedFocusedClosed<TItem>
  | SelectedFocusedOpened<TItem>
  | SelectedFocusedOpenedHighlighted<TItem>
  | SelectionFocused<TItem>;

/**
 * @memberof Model
 * @description
 * The init function returns the initial state of the combobox.
 */
export const init = <TItem>({
  allItems,
  mode,
}: {
  allItems: TItem[];
  mode?: Mode;
}): Model<TItem> => {
  return {
    type: "unselected__blurred",
    allItems,
    skipOnce: [],
    mode: mode ? mode : { type: "single-select" },
  };
};

/** @module Update **/

/**
 * @memberof Update
 * @description
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
      type: "pressed-unselect-button";
      item: TItem;
    }
  | {
      type: "focused-selected-item";
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
      type: "set-selected";
      selected: NonEmpty<TItem>;
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
      mode: Mode;
    };

/**
 * @memberof Update
 * @description
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
 * @memberof Update
 * @description
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
  if (
    isClosed(model) &&
    isOpened(output.model) &&
    isSelected(output.model) &&
    isNonEmpty(output.model.selected)
  ) {
    output.effects.push({
      type: "scroll-item-into-view",
      item: output.model.selected[0],
    });
  }

  // scroll highlighted item into view when navigating with keyboard
  if (
    isHighlighted(output.model) &&
    msg.type === "pressed-vertical-arrow-key"
  ) {
    const filtered = config.deterministicFilter(output.model);

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
      output.model.selected[output.model.focusedIndex];
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
  if (isBlurred(model) && isFocused(output.model)) {
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

  if (msg.type === "set-selected" && isSelected(model)) {
    return {
      ...model,
      selected: msg.selected,
    };
  }

  if (msg.type === "set-input-value" && isOpened(model)) {
    return {
      ...model,
      inputValue: msg.inputValue,
    };
  }

  if (msg.type === "set-highlight-index" && isHighlighted(model)) {
    return {
      ...model,
      highlightIndex: msg.highlightIndex,
    };
  }

  if (msg.type === "set-mode") {
    return {
      ...model,
      mode: msg.mode,
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
  const { toItemInputValue, toItemId, deterministicFilter } = config;
  switch (model.type) {
    case "selected__blurred": {
      switch (msg.type) {
        case "focused-input": {
          return {
            ...model,
            type: "selected__focused__opened",
            inputValue: modelToInputValue(config, model),
            selected: model.selected,
          };
        }

        case "pressed-unselect-button": {
          const removed = model.selected.filter(
            (selection) => toItemId(selection) !== toItemId(msg.item)
          );
          if (isNonEmpty(removed)) {
            return { ...model, selected: removed };
          }
          return { ...model, type: "unselected__blurred" };
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "selection_focused",
            focusedIndex: model.selected.findIndex(
              (item) => toItemId(item) === toItemId(msg.item)
            ),
          };
        }
        default: {
          return model;
        }
      }
    }

    case "selected__focused__closed": {
      switch (msg.type) {
        case "pressed-input": {
          return { ...model, type: "selected__focused__opened" };
        }

        case "blurred-input": {
          return { ...model, type: "selected__blurred" };
        }

        case "inputted-value": {
          if (msg.inputValue === "" && model.mode.type === "single-select") {
            return {
              ...model,
              inputValue: msg.inputValue,
              type: "unselected__focused__opened",
            };
          }
          return {
            ...model,
            inputValue: msg.inputValue,
            type: "selected__focused__opened",
          };
        }

        case "pressed-enter-key": {
          return {
            ...model,
            inputValue: modelToInputValue(config, model),
            type: "selected__focused__opened",
          };
        }

        case "pressed-vertical-arrow-key": {
          return {
            ...model,
            inputValue: modelToInputValue(config, model),
            type: "selected__focused__opened",
          };
        }

        case "pressed-horizontal-arrow-key": {
          if (model.inputValue === "" && msg.key === "arrow-left") {
            return {
              ...model,
              type: "selection_focused",
              focusedIndex: 0,
            };
          }
          return model;
        }

        case "pressed-unselect-button": {
          const removed = model.selected.filter(
            (selection) => toItemId(selection) !== toItemId(msg.item)
          );
          if (isNonEmpty(removed)) {
            return { ...model, selected: removed };
          }
          return { ...model, type: "unselected__focused__closed" };
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "selection_focused",
            focusedIndex: model.selected.findIndex(
              (item) => toItemId(item) === toItemId(msg.item)
            ),
          };
        }
        default: {
          return model;
        }
      }
    }

    case "selected__focused__opened": {
      switch (msg.type) {
        case "hovered-over-item": {
          return {
            ...model,
            type: "selected__focused__opened__highlighted",
            highlightIndex: msg.index,
          };
        }
        case "blurred-input": {
          return {
            ...model,
            type: "selected__blurred",
            selected: model.selected,
          };
        }

        case "pressed-input": {
          return {
            ...model,
            type: "selected__focused__closed",
          };
        }

        case "pressed-item": {
          const modelNew: Model<T> = {
            ...model,
            type: "selected__focused__closed",
            selected: addSelected(model.mode, msg.item, model.selected),
          };
          return {
            ...modelNew,
            inputValue: modelToInputValue(config, modelNew),
          };
        }

        case "inputted-value": {
          if (msg.inputValue === "" && model.mode.type === "single-select") {
            return {
              ...model,
              inputValue: "",
              type: "unselected__focused__opened",
            };
          }
          return { ...model, inputValue: msg.inputValue };
        }

        case "pressed-enter-key": {
          return {
            ...model,
            inputValue: modelToInputValue(config, model),
            type: "selected__focused__closed",
          };
        }

        case "pressed-vertical-arrow-key": {
          const filtered = deterministicFilter(model);

          const selectedIndex = filtered.findIndex((item) =>
            model.selected.some(
              (selection) => toItemId(item) === toItemId(selection)
            )
          );

          if (selectedIndex === -1) {
            return {
              ...model,
              highlightIndex: 0,
              type: "selected__focused__opened__highlighted",
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
            type: "selected__focused__opened__highlighted",
          };
        }

        case "pressed-escape-key": {
          return {
            ...model,
            type: "selected__focused__closed",
          };
        }

        case "pressed-horizontal-arrow-key": {
          if (model.inputValue === "" && msg.key === "arrow-left") {
            return {
              ...model,
              type: "selection_focused",
              focusedIndex: 0,
            };
          }
          return model;
        }

        case "pressed-unselect-button": {
          const removed = model.selected.filter(
            (selection) => toItemId(selection) !== toItemId(msg.item)
          );
          if (isNonEmpty(removed)) {
            return { ...model, selected: removed };
          }
          return { ...model, type: "unselected__focused__opened" };
        }

        default: {
          return model;
        }
      }
    }

    case "selected__focused__opened__highlighted": {
      switch (msg.type) {
        case "hovered-over-item": {
          return { ...model, highlightIndex: msg.index };
        }

        case "blurred-input": {
          return { ...model, type: "selected__blurred" };
        }

        case "pressed-item": {
          const pressedItem = msg.item;

          if (model.mode.type === "single-select") {
            const modelNew: Model<T> = {
              ...model,
              type: "selected__focused__closed",
              selected: addSelected(model.mode, pressedItem, model.selected),
            };
            return {
              ...modelNew,
              inputValue: modelToInputValue(config, modelNew),
            };
          }

          if (!isItemSelected(config, model, pressedItem)) {
            const modelNew: Model<T> = {
              ...model,
              type: "selected__focused__closed",
              selected: addSelected(model.mode, pressedItem, model.selected),
            };
            return {
              ...modelNew,
              inputValue: modelToInputValue(config, modelNew),
            };
          }

          const removed = model.selected.filter(
            (selection) => toItemId(selection) !== toItemId(pressedItem)
          );

          if (isNonEmpty(removed)) {
            return {
              ...model,
              type: "selected__focused__closed",
              selected: removed,
            };
          }

          return {
            ...model,
            type: "unselected__focused__closed",
          };
        }

        case "inputted-value": {
          if (msg.inputValue === "" && model.mode.type === "single-select") {
            return {
              ...model,
              inputValue: "",
              type: "unselected__focused__opened",
            };
          }
          return { ...model, inputValue: msg.inputValue };
        }

        case "pressed-vertical-arrow-key": {
          const filtered = deterministicFilter(model);
          const delta = msg.key === "arrow-down" ? 1 : -1;
          const highlightIndex = circularIndex(
            model.highlightIndex + delta,
            filtered.length
          );
          return { ...model, highlightIndex: highlightIndex };
        }

        case "pressed-horizontal-arrow-key": {
          if (model.inputValue === "" && msg.key === "arrow-left") {
            return {
              ...model,
              type: "selection_focused",
              focusedIndex: 0,
            };
          }
          return model;
        }

        case "pressed-enter-key": {
          const filtered = deterministicFilter(model);

          const enteredItem = filtered[model.highlightIndex];

          if (!enteredItem) {
            return { ...model, type: "selected__focused__closed" };
          }

          if (model.mode.type === "single-select") {
            return {
              ...model,
              inputValue: toItemInputValue(enteredItem),
              selected: addSelected(model.mode, enteredItem, model.selected),
              type: "selected__focused__closed",
            };
          }

          if (!isItemSelected(config, model, enteredItem)) {
            return {
              ...model,
              inputValue: "",
              selected: addSelected(model.mode, enteredItem, model.selected),
              type: "selected__focused__closed",
            };
          }

          const removed = model.selected.filter(
            (selection) => toItemId(selection) !== toItemId(enteredItem)
          );

          if (isNonEmpty(removed)) {
            return {
              ...model,
              inputValue: "",
              selected: removed,
              type: "selected__focused__closed",
            };
          }

          return {
            ...model,
            inputValue: "",
            type: "unselected__focused__closed",
          };
        }

        case "pressed-escape-key": {
          return { ...model, type: "selected__focused__closed" };
        }

        case "pressed-unselect-button": {
          const removed = model.selected.filter(
            (selection) => toItemId(selection) !== toItemId(msg.item)
          );
          if (isNonEmpty(removed)) {
            return { ...model, selected: removed };
          }
          return { ...model, type: "unselected__focused__opened__highlighted" };
        }

        case "focused-selected-item": {
          return {
            ...model,
            type: "selection_focused",
            focusedIndex: model.selected.findIndex(
              (item) => toItemId(item) === toItemId(msg.item)
            ),
          };
        }

        default: {
          return model;
        }
      }
    }

    case "unselected__blurred": {
      switch (msg.type) {
        case "focused-input": {
          return {
            ...model,
            type: "unselected__focused__opened",
            inputValue: "",
          };
        }
        default: {
          return model;
        }
      }
    }

    case "unselected__focused__closed": {
      switch (msg.type) {
        case "pressed-input": {
          return { ...model, type: "unselected__focused__opened" };
        }

        case "blurred-input": {
          return { ...model, type: "unselected__blurred" };
        }

        case "inputted-value": {
          return {
            ...model,
            type: "unselected__focused__opened",
            inputValue: msg.inputValue,
          };
        }

        case "pressed-vertical-arrow-key": {
          return { ...model, type: "unselected__focused__opened" };
        }

        default: {
          return model;
        }
      }
    }

    case "unselected__focused__opened": {
      switch (msg.type) {
        case "hovered-over-item": {
          return {
            ...model,
            type: "unselected__focused__opened__highlighted",
            highlightIndex: msg.index,
          };
        }

        case "blurred-input": {
          return { ...model, type: "unselected__blurred" };
        }

        case "pressed-input": {
          return { ...model, type: "unselected__focused__closed" };
        }

        case "pressed-item": {
          return {
            ...model,
            type: "selected__focused__closed",
            selected: [msg.item],
            inputValue: toItemInputValue(msg.item),
          };
        }

        case "inputted-value": {
          return { ...model, inputValue: msg.inputValue };
        }

        case "pressed-vertical-arrow-key": {
          const filtered = deterministicFilter(model);
          const highlightIndex =
            msg.key === "arrow-up" ? filtered.length - 1 : 0;

          return {
            ...model,
            type: "unselected__focused__opened__highlighted",
            highlightIndex,
          };
        }

        case "pressed-escape-key": {
          return { ...model, type: "unselected__focused__closed" };
        }

        default: {
          return model;
        }
      }
    }

    case "unselected__focused__opened__highlighted": {
      switch (msg.type) {
        case "hovered-over-item": {
          return { ...model, highlightIndex: msg.index };
        }

        case "blurred-input": {
          return { ...model, type: "unselected__blurred" };
        }

        case "pressed-item": {
          const modelNew: Model<T> = {
            ...model,
            type: "selected__focused__closed",
            selected: [msg.item],
          };
          return {
            ...modelNew,
            inputValue: modelToInputValue(config, modelNew),
          };
        }

        case "inputted-value": {
          return {
            ...model,
            type: "unselected__focused__opened",
            inputValue: msg.inputValue,
          };
        }

        case "pressed-vertical-arrow-key": {
          const filtered = deterministicFilter(model);
          const delta = msg.key === "arrow-down" ? 1 : -1;
          const highlightIndex = circularIndex(
            model.highlightIndex + delta,
            filtered.length
          );
          return {
            ...model,
            highlightIndex: highlightIndex,
          };
        }

        case "pressed-enter-key": {
          const filtered = deterministicFilter(model);

          const selectedNew = filtered[model.highlightIndex];

          if (!selectedNew) {
            return { ...model, type: "unselected__focused__closed" };
          }

          const modelNew: Model<T> = {
            ...model,
            selected: [selectedNew],
            type: "selected__focused__closed",
          };
          return {
            ...modelNew,
            inputValue: modelToInputValue(config, modelNew),
          };
        }

        case "pressed-escape-key": {
          return {
            ...model,
            type: "unselected__focused__closed",
          };
        }
        default: {
          return model;
        }
      }
    }

    case "selection_focused": {
      switch (msg.type) {
        case "pressed-horizontal-arrow-key": {
          if (model.focusedIndex === 0 && msg.key === "arrow-right") {
            return {
              ...model,
              inputValue: "",
              type: "selected__focused__closed",
            };
          }

          const delta = msg.key === "arrow-right" ? -1 : 1;
          const selectedItemHighlightIndexNew = clampIndex(
            model.focusedIndex + delta,
            model.selected.length
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
            type: "selected__focused__opened",
          };
        }

        case "inputted-value": {
          return {
            ...model,
            inputValue: msg.inputValue,
            type: "selected__focused__opened",
          };
        }

        case "pressed-escape-key": {
          return {
            ...model,
            inputValue: "",
            type: "selected__focused__closed",
          };
        }

        case "pressed-backspace-key": {
          const removedHighlightedIndex = model.selected.filter(
            (_, index) => index !== model.focusedIndex
          );

          if (isNonEmpty(removedHighlightedIndex)) {
            return {
              ...model,
              selected: removedHighlightedIndex,
              inputValue: "",
              type: "selected__focused__closed",
            };
          }

          return {
            ...model,
            inputValue: "",
            type: "unselected__focused__closed",
          };
        }

        case "pressed-unselect-button": {
          const removed = model.selected.filter(
            (selection) => toItemId(selection) !== toItemId(msg.item)
          );
          if (isNonEmpty(removed)) {
            const selectedItemHighlightIndex = clampIndex(
              model.focusedIndex,
              removed.length
            );
            return {
              ...model,
              selected: removed,
              focusedIndex: selectedItemHighlightIndex,
            };
          }
          return {
            ...model,
            inputValue: "",
            type: "unselected__focused__closed",
          };
        }

        case "focused-selected-item": {
          return {
            ...model,

            type: "selection_focused",
            focusedIndex: model.selected.findIndex(
              (item) => toItemId(item) === toItemId(msg.item)
            ),
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

const addSelected = <TItem>(
  mode: Mode,
  item: TItem,
  selected: NonEmpty<TItem>
): NonEmpty<TItem> => {
  if (mode.type === "single-select") {
    return [item];
  }
  const selectedNew = [...selected, item];
  if (isNonEmpty(selectedNew)) {
    return selectedNew;
  }
  return selected;
};

const modelToInputValue = <TItem>(
  config: Config<TItem>,
  model: Model<TItem>
): string => {
  if (isSelected(model) && model.mode.type === "single-select") {
    return config.toItemInputValue(model.selected[0]);
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
 * @memberof Selectors
 * @description
 * Utility function to determine if any item is selected.
 */
export const isSelected = <TItem>(
  model: ModelState<TItem>
): model is SelectedState<TItem> => {
  return (
    model.type === "selected__focused__opened" ||
    model.type === "selected__focused__opened__highlighted" ||
    model.type === "selected__blurred" ||
    model.type === "selected__focused__closed"
  );
};
export type SelectedState<TItem> =
  | SelectedBlurred<TItem>
  | SelectedFocusedClosed<TItem>
  | SelectedFocusedOpened<TItem>
  | SelectedFocusedOpenedHighlighted<TItem>;

/**
 * @memberof Selectors
 * @description
 * Utility function to determine if in unselected state
 */
export const isUnselected = <TItem>(
  model: ModelState<TItem>
): model is UnselectedState<TItem> => {
  return (
    model.type === "selected__focused__opened" ||
    model.type === "selected__focused__opened__highlighted" ||
    model.type === "selected__blurred" ||
    model.type === "selected__focused__closed"
  );
};
export type UnselectedState<TItem> = Exclude<
  ModelState<TItem>,
  SelectedState<TItem>
>;

/**
 * @memberof Selectors
 * @description
 * Utility function to determine if the dropdown is opened.
 */
export const isOpened = <TItem>(
  model: ModelState<TItem>
): model is OpenedState<TItem> => {
  return (
    model.type === "selected__focused__opened" ||
    model.type === "selected__focused__opened__highlighted" ||
    model.type === "unselected__focused__opened" ||
    model.type === "unselected__focused__opened__highlighted"
  );
};
export type OpenedState<TItem> =
  | UnselectedFocusedOpened
  | UnselectedFocusedOpenedHighlighted
  | SelectedFocusedOpened<TItem>
  | SelectedFocusedOpenedHighlighted<TItem>;

/**
 * @memberof Selectors
 * @description
 * Utility function to determine if the dropdown is closed.
 */
export const isClosed = <TItem>(
  model: ModelState<TItem>
): model is ClosedState<TItem> => {
  return !isOpened(model);
};
export type ClosedState<TItem> = Exclude<ModelState<TItem>, OpenedState<TItem>>;

/**
 * @memberof Selectors
 * @description
 * Utility function to determine if any item is highlighted.
 */
export const isHighlighted = <TItem>(
  model: ModelState<TItem>
): model is HighlightedState<TItem> => {
  return (
    model.type === "selected__focused__opened__highlighted" ||
    model.type === "unselected__focused__opened__highlighted"
  );
};

export type HighlightedState<TItem> =
  | UnselectedFocusedOpenedHighlighted
  | SelectedFocusedOpenedHighlighted<TItem>;

/**
 * @memberof Selectors
 * @description
 * Utility function to determine if input is blurred.
 */
export const isBlurred = <TItem>(
  model: ModelState<TItem>
): model is UnselectedBlurred | SelectedBlurred<TItem> => {
  return (
    model.type === "unselected__blurred" || model.type === "selected__blurred"
  );
};
export type BlurredState<TItem> = UnselectedBlurred | SelectedBlurred<TItem>;

/**
 * @memberof Selectors
 * @description
 */
export const isSelectionFocused = <T>(
  model: ModelState<T>
): model is SelectionFocused<T> => {
  return model.type === "selection_focused";
};

/**
 * @memberof Selectors
 * @description
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
 * @memberof Selectors
 * @description
 * This function returns the value that the input element should have.
 */
export const toCurrentInputValue = <TItem>(
  config: Config<TItem>,
  model: Model<TItem>
): string => {
  switch (model.type) {
    case "unselected__blurred": {
      return "";
    }

    case "selected__blurred": {
      return modelToInputValue(config, model);
    }

    case "selected__focused__closed":
    case "selected__focused__opened":
    case "selected__focused__opened__highlighted":
    case "unselected__focused__closed":
    case "unselected__focused__opened":
    case "unselected__focused__opened__highlighted": {
      return model.inputValue;
    }

    case "selection_focused": {
      return "";
    }
  }
};

/**
 * @memberof Selectors
 * @description
 * This function returns the highlighted item.
 */
export const toHighlightedItem = <TItem>(
  { deterministicFilter }: Pick<Config<TItem>, "deterministicFilter">,
  model: Model<TItem>
): TItem | null => {
  switch (model.type) {
    case "unselected__blurred":
    case "unselected__focused__closed":
    case "unselected__focused__opened":
    case "selected__blurred":
    case "selected__focused__opened":
    case "selection_focused":
    case "selected__focused__closed": {
      return null;
    }

    case "unselected__focused__opened__highlighted":
    case "selected__focused__opened__highlighted": {
      const item = deterministicFilter(model)[model.highlightIndex];

      return item ?? null;
    }
  }
};

/**
 * @memberof Selectors
 * @description
 * Utility function to determine if an item is highlighted.
 */
export const isItemHighlighted = <TItem>(
  config: Pick<Config<TItem>, "toItemId" | "deterministicFilter">,
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
 * @memberof Selectors
 * @description
 * This function returns the selected item
 */
export const toSelections = <TItem>(model: Model<TItem>): TItem[] => {
  switch (model.type) {
    case "selected__blurred":
    case "selected__focused__opened":
    case "selected__focused__closed":
    case "selected__focused__opened__highlighted":
    case "selection_focused":
      return model.selected;

    case "unselected__blurred":
    case "unselected__focused__closed":
    case "unselected__focused__opened":
    case "unselected__focused__opened__highlighted":
      return [];
  }
};

/**
 * @memberof Selectors
 * @description
 * This function returns the selected item
 */
export const toSelectedItem = <TItem>(model: Model<TItem>): TItem | null => {
  switch (model.type) {
    case "selected__blurred":
    case "selected__focused__opened":
    case "selected__focused__closed":
    case "selected__focused__opened__highlighted":
    case "selection_focused":
      if (isSingle(model.selected)) {
        return model.selected[0];
      }
      return null;

    case "unselected__blurred":
    case "unselected__focused__closed":
    case "unselected__focused__opened":
    case "unselected__focused__opened__highlighted":
      return null;
  }
};

/**
 * @memberof Selectors
 * @description
 * Utility function to determine if an item is selected.
 */
export const isItemSelected = <TItem>(
  { toItemId }: Pick<Config<TItem>, "toItemId">,
  model: Model<TItem>,
  item: TItem
): boolean => {
  switch (model.type) {
    case "selection_focused":
    case "selected__blurred":
    case "selected__focused__opened":
    case "selected__focused__closed":
    case "selected__focused__opened__highlighted": {
      return model.selected.some(
        (selection) => toItemId(selection) === toItemId(item)
      );
    }

    case "unselected__blurred":
    case "unselected__focused__closed":
    case "unselected__focused__opened":
    case "unselected__focused__opened__highlighted": {
      return false;
    }
  }
};

/**
 * @memberof Selectors
 * @description
 * Selector function to determine if an index is selected.
 */
export const isItemIndexHighlighted = <TItem>(
  model: Model<TItem>,
  index: number
): boolean => {
  switch (model.type) {
    case "unselected__blurred":
    case "unselected__focused__closed":
    case "unselected__focused__opened":
    case "selected__blurred":
    case "selected__focused__opened":
    case "selection_focused":
    case "selected__focused__closed": {
      return false;
    }

    case "unselected__focused__opened__highlighted":
    case "selected__focused__opened__highlighted": {
      return model.highlightIndex === index;
    }
  }
};

/**
 * @memberof Selectors
 * @description
 * Selector function to determine if an item is selected and highlighted.
 */
export const isItemSelectedAndHighlighted = <TItem>(
  config: Pick<Config<TItem>, "toItemId" | "deterministicFilter">,
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
 * @memberof Selectors
 *
 */
export const isSelectedItemFocused = <T>(
  config: Config<T>,
  model: Model<T>,
  selectedItem: T
) => {
  return (
    isSelectionFocused(model) &&
    model.selected.findIndex(
      (item) => config.toItemId(item) === config.toItemId(selectedItem)
    ) === model.focusedIndex
  );
};

/**
 * @memberof Selectors
 * @description
 * This type represents all the possible states of an item
 */
export type ItemStatus =
  | "selected-and-highlighted"
  | "selected"
  | "highlighted"
  | "unselected";

/**
 * @memberof Selectors
 * @description
 * This utility function returns the status of an item.
 */
export const toItemStatus = <TItem>(
  config: Pick<Config<TItem>, "toItemId" | "deterministicFilter">,
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
 * @memberof Selectors
 * @description
 * This function returns the all the visible items.
 * This function really isn't necessary, but it's here for a more consistent API.
 */
export const toVisibleItems = <T>(config: Config<T>, model: Model<T>): T[] => {
  return config.deterministicFilter(model);
};

/** @module Helpers **/

/**
 * @memberof Helpers
 * @description
 * This helper function converts a keyboard event key property to a message.
 **/
export const browserKeyboardEventKeyToMsg = <T>(
  key: string
): (Msg<T> & { shouldPreventDefault?: boolean }) | null => {
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
    return { type: "pressed-enter-key" };
  }

  return null;
};

/**
 * @memberof Selectors
 * @description
 * This function returns an object of all the returns of all the selectors.
 */
export const toState = <T>(config: Config<T>, model: Model<T>) => {
  return {
    aria: aria(config, model),
    allItems: model.allItems,
    items: toVisibleItems(config, model),
    isOpened: isOpened(model),
    selections: toSelections(model),
    inputValue: toCurrentInputValue(config, model),
    isBlurred: isBlurred(model),
    isFocused: isFocused(model),
    selectedItem: toSelectedItem(model),
    highlightedItem: toHighlightedItem(config, model),
    isItemHighlighted: (item: T) => isItemHighlighted<T>(config, model, item),
    isItemSelected: (item: T) => isItemSelected<T>(config, model, item),
    isItemIndexHighlighted: (index: number) =>
      isItemIndexHighlighted<T>(model, index),
    itemStatus: (item: T) => toItemStatus(config, model, item),
    isSelectedItemFocused: (selectedItem: T) =>
      isSelectedItemFocused(config, model, selectedItem),
  } as const;
};

/** @module Debug **/

/**
 * @memberof Debug
 * @description
 * This function logs the state of the model and the effects.
 **/
export const debug = <TItem>({
  log,
  input,
  output,
}: {
  log: (...args: unknown[]) => void;
  input: {
    model: Model<TItem>;
    msg: Msg<TItem>;
  };
  output: {
    model: Model<TItem>;
    effects: Effect<TItem>[];
  };
}) => {
  log("\n");
  log("PREV ", input.model.type);
  log("msg: ", input.msg.type);
  log("NEXT ", output.model.type);
  if (output.model.skipOnce.length > 0) {
    log("skips: ", output.model.skipOnce.join(", "));
  }
  if (output.effects.length > 0) {
    log("effects: ", output.effects.map((eff) => eff.type).join(", "));
  }
  log("\n");
};

/**
 *
 *
 * Helpers
 *
 *
 */

const removeFirst = <T>(predicate: (x: T) => boolean, arr: T[]): T[] => {
  const index = arr.findIndex(predicate);
  if (index === -1) return arr;
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
};

type NonEmpty<T> = [T, ...T[]];

const isNonEmpty = <T>(arr: T[]): arr is NonEmpty<T> => {
  return arr.length > 0;
};

export const isSingle = <T>(arr: T[]): arr is [T] => {
  return arr.length === 1;
};

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
