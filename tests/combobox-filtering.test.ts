import { describe, expect, it } from "vitest";
import * as Combobox from "../src";
import { allItems, config } from "./shared";

describe("combobox filtering", () => {
  it('never returns stales results from memoized filtered items', () => {
    const initial = Combobox.init(config, {
      allItems,
      selectMode: { type: "single-select" },
    });
    const firstSetAllItems = Combobox.update(config, {
      model: initial,
      msg: { type: "set-all-items", allItems: []},
    });
    const secondSetAllItems = Combobox.update(config, {
      model: firstSetAllItems.model,
      msg: { type: "set-all-items", allItems },
    });
    expect(Combobox.toFilteredItemsMemoized(config)(initial)).toEqual(Combobox.toFilteredItems(config, initial));
    expect(Combobox.toFilteredItemsMemoized(config)(firstSetAllItems.model)).toEqual(Combobox.toFilteredItems(config, firstSetAllItems.model));
    expect(Combobox.toFilteredItemsMemoized(config)(secondSetAllItems.model)).toEqual(Combobox.toFilteredItems(config, secondSetAllItems.model));
  })
});
