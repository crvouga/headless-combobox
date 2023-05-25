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
 * @group WAI-ARIA
 * @description
 * This function returns WAI-ARIA attributes for html that describes the <input />.
 */
const ariaHelperText = <T>(config: Config<T>) => {
  return {
    id: helperTextHtmlId(config),
  };
};

/**
 * @group WAI-ARIA
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
 * @group WAI-ARIA
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
 * @group WAI-ARIA
 * @description
 * This function returns WAI-ARIA attributes for the "suggestion list" <ul />.
 */
export const ariaItemList = <T>(config: Config<T>, model: Model<T>) => {
  return {
    id: itemListHtmlId(config),
    role: "listbox",
    "aria-labelledby": inputLabelHtmlId(config),
    tabindex: -1,
    "aria-multiselectable": model.selectMode.type === "multi-select",
  } as const;
};

/**
 * @group WAI-ARIA
 * @description
 * This function returns WAI-ARIA attributes for the "option" <li />.
 */
export const ariaItem = <T>(config: Config<T>, model: Model<T>, item: T) => {
  return {
    id: itemHtmlId(config, item),
    role: "option",
    "aria-selected": isItemSelected(config, model, item),
    "aria-disabled": false,
  } as const;
};

/**
 * @group WAI-ARIA
 */
const inputLabelHtmlId = <T>({ namespace }: Config<T>) => {
  return `${namespace}-input-label`;
};

/**
 * @group WAI-ARIA
 */
const inputHtmlId = <T>({ namespace }: Config<T>) => {
  return `${namespace}-input`;
};

/**
 * @group WAI-ARIA
 */
const itemListHtmlId = <T>({ namespace }: Config<T>) => {
  return `${namespace}-item-list`;
};

/**
 * @group WAI-ARIA
 */
const itemHtmlId = <T>({ toItemId, namespace }: Config<T>, item: T) => {
  return `${namespace}-item-${toItemId(item)}`;
};

/**
 * @group WAI-ARIA
 */
const helperTextHtmlId = <T>({ namespace }: Config<T>) => {
  return `${namespace}-helper-text`;
};

/**
 * @group WAI-ARIA
 */
const selectedListId = <T>({ namespace }: Config<T>) => {
  return `${namespace}-selected-list`;
};

/**
 * @group WAI-ARIA
 */
const selectedListItemId = <T>({ namespace, toItemId }: Config<T>, item: T) => {
  return `${namespace}-selected-list-item-${toItemId(item)}`;
};

/**
 * @group WAI-ARIA
 */
const ariaSelectedList = <T>(config: Config<T>, model: Model<T>) => {
  const highlightedSelectedItem = isSelectionFocused(model)
    ? model.selected[model.focusedIndex] ?? null
    : null;
  return {
    id: selectedListId(config),
    "aria-label": ariaContentDefaults.selectedListLabel,
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
    tabindex: -1,
  };
};

/**
 * @group WAI-ARIA
 * @description
 * This function returns WAI-ARIA attributes for the "unselect" button.
 */
const ariaUnselectButton = () => {
  return {
    role: "button",
    tabindex: -1,
    "aria-label": "Unselect",
    "aria-hidden": "true", // right now unselect button is hidden from screen readers
  } as const;
};

/**
 * @group WAI-ARIA
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

export const ariaContentDefaults = {
  helperText: "Use arrow keys to navigate. Enter key to toggle item selection.",
  selectedListLabel: "Use arrow keys to navigate. Backspace to unselect item.",
};
