import {
  Config,
  Model,
  isOpened,
  toHighlightedItem,
  toSelectedItem,
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
export const ariaItemList = <T>(config: Config<T>) => {
  return {
    id: itemListHtmlId(config),
    role: "listbox",
    "aria-labelledby": inputLabelHtmlId(config),
    tabindex: -1,
  } as const;
};

/**
 * @memberof WAI-ARIA
 * @description
 * This function returns WAI-ARIA attributes for the "option" <li />.
 */
export const ariaItem = <T>(config: Config<T>, model: Model<T>, item: T) => {
  const selected = toSelectedItem(model);
  return {
    id: itemHtmlId(config, item),
    role: "option",
    ...(selected
      ? {
          "aria-selected": config.toItemId(item) === config.toItemId(selected),
        }
      : {}),
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
 * @description
 * This function returns WAI-ARIA attributes for the all html elements.
 */
export const aria = <T>(config: Config<T>, model: Model<T>) => {
  return {
    inputLabel: ariaInputLabel(config),
    input: ariaInput(config, model),
    helperText: ariaHelperText(config),
    itemList: ariaItemList(config),
    item: (item: T) => ariaItem(config, model, item),
  };
};
