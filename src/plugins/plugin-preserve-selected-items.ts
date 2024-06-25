import type { Plugin, SelectedItemListDirection } from "../combobox";

/**
 * This plugin will preserve the selected items even when not in the all items list.
 */
export const preseveSelectedItems =
  <T>(): Plugin<T> =>
  ({ output, initialModel, input }) => {
    switch (input.msg.type) {
      case "set-all-items": {
        const selectedItemsInput = initialModel.selectedItems;
        return {
          ...output,
          events: output.events.filter(event => event.type !== 'selected-items-changed'),
          model: {
            ...output.model,
            selectedItems: selectedItemsInput,
            inputMode: initialModel.inputMode,
          },
        };
      }
    }

    return output;
  };

