import type { Plugin, SelectedItemListDirection } from "../combobox";

/**
 * This plugin sets the select mode to multi select.
 */
export const muliSelect =
  <T>({
    selectedItemListDirection = "left-to-right",
    disableSelectedItemListKeyboardNavigation = false,
  }: {
    selectedItemListDirection?: SelectedItemListDirection;
    disableSelectedItemListKeyboardNavigation?: boolean;
  } = {}): Plugin<T> =>
  ({ output }) => {
    return {
      ...output,
      model: {
        ...output.model,
        selectMode: {
          type: "multi-select",
          selectedItemListDirection,
          disableSelectedItemListKeyboardNavigation,
        },
      },
    };
  };
