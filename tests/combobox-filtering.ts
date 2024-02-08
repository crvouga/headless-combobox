import { describe, expect, it } from "vitest";
import * as Combobox from "../src";
import { allItems, config } from "./shared";

describe("combobox filtering", () => {
  it('never returns stales results from memoized filtered items', () => {
    const initial = Combobox.init(config, {
      allItems,
      selectMode: { type: "single-select" },
    });
    const setAllItems = Combobox.update(config, {
      model: initial,
      msg: { type: "set-all-items", allItems: []},
    });
    
    
    
  })
});
