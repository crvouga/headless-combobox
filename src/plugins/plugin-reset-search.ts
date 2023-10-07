import type { Plugin } from "../combobox";
import { isClosed, isOpened } from "../combobox";

/**
 * This plugin resets the search when the dropdown is toggled.
 * All search results are shown when the dropdown is opened again.
 */
export const resetSearchOnDropdownToggle =
  <T>(): Plugin<T> =>
  ({ initialModel, output }) => {
    if (
      isOpened(initialModel) &&
      isClosed(output.model) &&
      output.model.inputMode.type === "search-mode"
    ) {
      return {
        ...output,
        model: {
          ...output.model,
          inputMode: {
            ...output.model.inputMode,
            hasSearched: false,
          },
        },
      };
    }
    return output;
  };
