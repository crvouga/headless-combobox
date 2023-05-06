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

type ModelState<TItem> =
  | UnselectedBlurred
  | UnselectedFocusedOpened
  | UnselectedFocusedOpenedHighlighted
  | UnselectedFocusedClosed
  | SelectedBlurred<TItem>
  | SelectedFocusedClosed<TItem>
  | SelectedFocusedOpened<TItem>
  | SelectedFocusedOpenedHighlighted<TItem>;

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
export type Effect<TItem> = {
  type: "scroll-item-into-view";
  item: TItem;
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
  if (isHighlighted(output.model) && msg.type === "pressed-arrow-key") {
    const filtered = config.deterministicFilter(output.model);

    const highlightedItem = filtered[output.model.highlightIndex];

    if (highlightedItem) {
      output.effects.push({
        type: "scroll-item-into-view",
        item: highlightedItem,
      });
    }
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

const updateModel = <TItem>(
  config: Config<TItem>,
  {
    model,
    msg,
  }: {
    model: Model<TItem>;
    msg: Msg<TItem>;
  }
): Model<TItem> => {
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

        case "pressed-arrow-key": {
          return {
            ...model,
            inputValue: modelToInputValue(config, model),
            type: "selected__focused__opened",
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
          const modelNew: Model<TItem> = {
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

        case "pressed-arrow-key": {
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
            const modelNew: Model<TItem> = {
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
            const modelNew: Model<TItem> = {
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

        case "pressed-arrow-key": {
          const filtered = deterministicFilter(model);
          const delta = msg.key === "arrow-down" ? 1 : -1;
          const highlightIndex = circularIndex(
            model.highlightIndex + delta,
            filtered.length
          );
          return { ...model, highlightIndex };
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

        case "pressed-arrow-key": {
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

        case "pressed-arrow-key": {
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
          const modelNew: Model<TItem> = {
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

        case "pressed-arrow-key": {
          const filtered = deterministicFilter(model);
          const delta = msg.key === "arrow-down" ? 1 : -1;
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
          const filtered = deterministicFilter(model);

          const selectedNew = filtered[model.highlightIndex];

          if (!selectedNew) {
            return { ...model, type: "unselected__focused__closed" };
          }

          const modelNew: Model<TItem> = {
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
) => {
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
) => {
  switch (model.type) {
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
export const isIndexHighlighted = <TItem>(
  model: Model<TItem>,
  index: number
): boolean => {
  switch (model.type) {
    case "unselected__blurred":
    case "unselected__focused__closed":
    case "unselected__focused__opened":
    case "selected__blurred":
    case "selected__focused__opened":
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
export const browserKeyboardEventKeyToMsg = <T>(key: string): Msg<T> | null => {
  const eq = (a: string, b: string) =>
    a.toLowerCase().trim() === b.toLowerCase().trim();

  if (eq(key, "ArrowDown")) {
    return {
      type: "pressed-arrow-key",
      key: "arrow-down",
    };
  }

  if (eq(key, "ArrowUp")) {
    return {
      type: "pressed-arrow-key",
      key: "arrow-up",
    };
  }

  if (eq(key, "Escape")) {
    return { type: "pressed-escape-key" } satisfies Msg<unknown>;
  }

  if (eq(key, "Enter")) {
    return { type: "pressed-enter-key" } satisfies Msg<unknown>;
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
    allItems: model.allItems,
    items: toVisibleItems(config, model),
    isOpened: isOpened(model),
    highlightedItem: toHighlightedItem(config, model),
    selections: toSelections(model),
    inputValue: toCurrentInputValue(config, model),
    selectedItem: toSelectedItem(model),
    aria: aria(config, model),
    isBlurred: isBlurred(model),
    isFocused: isFocused(model),
    isItemHighlighted: (item: T) => isItemHighlighted<T>(config, model, item),
    isItemSelected: (item: T) => isItemSelected<T>(config, model, item),
    isIndexHighlighted: (index: number) => isIndexHighlighted<T>(model, index),
    itemStatus: (item: T) => toItemStatus(config, model, item),
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
