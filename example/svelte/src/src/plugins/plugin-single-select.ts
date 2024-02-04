import type { Plugin } from "../combobox";

/**
 * This plugin sets the select mode to single select.
 */
export const singleSelect =
  <T>(): Plugin<T> =>
  ({ output }) => {
    return {
        ...output,
        model: {
            ...output.model,
            selectMode: { type: "single-select" },
        },
    }
  };
