import {
  toHighlightedItem,
  clearInputValue,
  removeSelectedItem,
} from "../combobox";
import type { Plugin } from "../combobox";

/**
 * @description This plugin removed the selected items when they are selected.
 */
export const toggleOnSelect =
  <T>(): Plugin<T> =>
  ({ config, input, output }) => {
    const { msg } = input;

    const inputtedItem =
      msg.type === "pressed-enter-key"
        ? toHighlightedItem(config, input.model)
        : msg.type === "pressed-item"
        ? msg.item
        : null;

    if (inputtedItem === null) {
      return output;
    }

    const itemWasSelected = input.model.selectedItems.some(
      (x) => config.toItemId(x) === config.toItemId(inputtedItem)
    );

    const itemIsSelected = output.model.selectedItems.some(
      (x) => config.toItemId(x) === config.toItemId(inputtedItem)
    );

    if (itemWasSelected && itemIsSelected) {
      const modelNew = removeSelectedItem({
        config,
        item: inputtedItem,
        model: clearInputValue(output.model),
      });

      return {
        effects: [...output.effects, { type: "blur-input" }],
        events: [...output.events, { type: "selected-items-changed" }],
        model: modelNew,
      };
    }

    return output;
  };
