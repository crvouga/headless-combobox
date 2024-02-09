import { describe, expect, it } from "vitest";
import * as Combobox from "../../src";
import { Item, allItems, config } from "../shared";

export const initMultiSelect = (selectedItemListDirection: Combobox.SelectedItemListDirection) => {
  return Combobox.init(config, {
    allItems: allItems,
    selectMode: {
      type: "multi-select",
      selectedItemListDirection,
    },
  });
};

const selectVisibleItem = (model: Combobox.Model<Item>, index: number) => {
  return Combobox.chainUpdates(
    { model, effects: [], events: [] },
    (model) =>
      Combobox.update(config, { model, msg: { type: "pressed-input" } }),
    (model) =>
      Combobox.update(config, {
        model,
        msg: {
          type: "pressed-item",
          item: Combobox.toFilteredItemsMemoized(config)(model)[index],
        },
      })
  );
};

export const selectFirstThreeVisibleItems =(model: Combobox.Model<Item>) => {
  return Combobox.chainUpdates(
    { model, effects: [], events: [] },
    (model) => selectVisibleItem(model, 0),
    (model) => selectVisibleItem(model, 1),
    (model) => selectVisibleItem(model, 2)
  );
};

export const pressArrowLeft = (model: Combobox.Model<Item>) => {
  return Combobox.update(config, {
    model,
    msg: { type: "pressed-horizontal-arrow-key", key: 'arrow-left'  },
  });
}


export const pressArrowRight = (model: Combobox.Model<Item>) => {
  return Combobox.update(config, {
    model,
    msg: { type: "pressed-horizontal-arrow-key", key: 'arrow-right'  },
  });
}
