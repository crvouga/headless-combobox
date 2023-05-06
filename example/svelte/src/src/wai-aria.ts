import {
  isItemSelected,
  isOpened,
  isSelectionFocused,
  toHighlightedItem,
  type Config,
  type Model,
} from "./core";

/** @module WAI-ARIA **/

/**
 * @memberof WAI-ARIA
 * @description
 * This function returns WAI-ARIA attributes for html that describes the <input />.
 */
const ariaHelperText = <T>(config: Config<T>) => {
  return {
    id: helperTextHtmlId(config),
  };
};

/**
 * @memberof WAI-ARIA
 * @description
 * This function returns WAI-ARIA attributes for the <label />.
 */
export const ariaInputLabel = <T>(config: Config<T>) => {
  return {
    id: inputLabelHtmlId(config),
    for: inputHtmlId(config),
    htmlFor: inputHtmlId(config),
  };
};

/**
 * @memberof WAI-ARIA
 * @description
 * This function returns WAI-ARIA attributes for the <input />.
 */
export const ariaInput = <T>(config: Config<T>, model: Model<T>) => {
  const highlightedItem = toHighlightedItem(config, model);
  return {
    id: inputHtmlId(config),
    role: "combobox",
    tabindex: 0,
    combobox: "off",
    spellcheck: "false",
    "aria-autocomplete": "list",
    "aria-controls": itemListHtmlId(config),
    "aria-haspopup": "listbox",
    "aria-expanded": isOpened(model) ? "true" : "false",
    "aria-describedby": helperTextHtmlId(config),
    ...(highlightedItem
      ? {
          "aria-activedescendant": itemHtmlId(config, highlightedItem),
        }
      : {}),
  } as const;
};

/**
 * @memberof WAI-ARIA
 * @description
 * This function returns WAI-ARIA attributes for the "suggestion list" <ul />.
 */
export const ariaItemList = <T>(config: Config<T>, model: Model<T>) => {
  return {
    id: itemListHtmlId(config),
    role: "listbox",
    "aria-labelledby": inputLabelHtmlId(config),
    tabindex: -1,
    "aria-multiselectable": model.mode.type === "multi-select",
  } as const;
};

/**
 * @memberof WAI-ARIA
 * @description
 * This function returns WAI-ARIA attributes for the "option" <li />.
 */
export const ariaItem = <T>(config: Config<T>, model: Model<T>, item: T) => {
  return {
    id: itemHtmlId(config, item),
    role: "option",
    "aria-selected": isItemSelected(config, model, item),
  } as const;
};

/**
 * @memberof WAI-ARIA
 */
const inputLabelHtmlId = <T>({ namespace }: Config<T>) => {
  return `${namespace}-input-label`;
};

/**
 * @memberof WAI-ARIA
 */
const inputHtmlId = <T>({ namespace }: Config<T>) => {
  return `${namespace}-input`;
};

/**
 * @memberof WAI-ARIA
 */
const itemListHtmlId = <T>({ namespace }: Config<T>) => {
  return `${namespace}-item-list`;
};

/**
 * @memberof WAI-ARIA
 */
const itemHtmlId = <T>({ toItemId, namespace }: Config<T>, item: T) => {
  return `${namespace}-item-${toItemId(item)}`;
};

/**
 * @memberof WAI-ARIA
 */
const helperTextHtmlId = <T>({ namespace }: Config<T>) => {
  return `${namespace}-helper-text`;
};

/**
 * @memberof WAI-ARIA
 */
const selectedListId = <T>({ namespace }: Config<T>) => {
  return `${namespace}-selected-list`;
};

/**
 * @memberof WAI-ARIA
 */
const selectedListItemId = <T>({ namespace, toItemId }: Config<T>, item: T) => {
  return `${namespace}-selected-list-item-${toItemId(item)}`;
};

/**
 * @memberof WAI-ARIA
 * @description
 * This function returns WAI-ARIA attributes for the all html elements.
 */

const ariaSelectedList = <T>(config: Config<T>, model: Model<T>) => {
  const highlightedSelectedItem = isSelectionFocused(model)
    ? model.selected[model.focusedIndex] ?? null
    : null;
  return {
    id: selectedListId(config),
    role: "list",
    ...(highlightedSelectedItem
      ? {
          "aria-activedescendant": selectedListItemId(
            config,
            highlightedSelectedItem
          ),
        }
      : {}),
  };
};

const ariaSelectedItem = <T>(config: Config<T>, model: Model<T>, item: T) => {
  return {
    id: selectedListItemId(config, item),
    role: "listitem",
    tabindex: 0,
  };
};

/**
 * @memberof WAI-ARIA
 * @description
 * This function returns WAI-ARIA attributes for the "unselect" button.
 */
const ariaUnselectButton = () => {
  return {
    role: "button",

    tabindex: -1,
  };
};

/**
 * @memberof WAI-ARIA
 * @description
 * This function returns WAI-ARIA attributes for the all html elements.
 */
export const aria = <T>(config: Config<T>, model: Model<T>) => {
  return {
    inputLabel: ariaInputLabel(config),
    input: ariaInput(config, model),
    helperText: ariaHelperText(config),
    itemList: ariaItemList(config, model),
    item: (item: T) => ariaItem(config, model, item),
    selectedList: ariaSelectedList(config, model),
    selectedItem: (item: T) => ariaSelectedItem(config, model, item),
    unselectButton: (_item: T) => ariaUnselectButton(),
  };
};

export const defaultContent = {
  helperText: "Use arrow keys to navigate. Enter key to toggle selection",
  selectedList: "Use arrow keys to navigate. Backspace to unselect",
};
