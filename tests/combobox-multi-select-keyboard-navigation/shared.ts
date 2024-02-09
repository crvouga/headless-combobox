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
  const pressesDown: (typeof pressArrowDown)[] = []
  for(let i = 0; i < index + 1; i++) {
    pressesDown.push(pressArrowDown)
  }
  return Combobox.chainUpdates(
    { model, effects: [], events: [] },
    (model) => Combobox.update(config, { model, msg: { type: "pressed-input" } }),
    ...pressesDown,
    (model) => pressEnter(model)
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


export const pressArrowDown = (model: Combobox.Model<Item>) => {
  return Combobox.update(config, {
    model,
    msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down'  },
  });
}

export const pressArrowUp = (model: Combobox.Model<Item>) => {
  return Combobox.update(config, {
    model,
    msg: { type: "pressed-vertical-arrow-key", key: 'arrow-up'  },
  });
}

export const pressEnter = (model: Combobox.Model<Item>) => {
  return Combobox.update(config, {
    model,
    msg: { type: "pressed-enter-key" },
  });
}

export const pressEscape = (model: Combobox.Model<Item>) => {
  return Combobox.update(config, {
    model,
    msg: { type: "pressed-escape-key" },
  });
}


export const pressBackspace = (model: Combobox.Model<Item>) => {
  return Combobox.update(config, {
    model,
    msg: { type: "pressed-backspace-key" },
  });
}