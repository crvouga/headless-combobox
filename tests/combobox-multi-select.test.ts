import { describe, expect, it } from "vitest";
import * as Combobox from "../src";
import { allItems, config } from "./shared";

const initMultiSelect = () => {
  return Combobox.init(config, {
    allItems: allItems,
    selectMode: {
      type: "multi-select",
      selectedItemListDirection: "left-to-right",
    },
  });
};

describe("combobox multi select", () => {
  it("starts with no selected items", () => {
    const initial = initMultiSelect();
    expect(Combobox.toSelectedItems(initial).length).toBe(0);
  });

  it("can select multi items", () => {
    const output = Combobox.chainUpdates(
      {
        model: initMultiSelect(),
        effects: [],
        events: [],
      },
      (model) =>
        Combobox.update(config, {
          model,
          msg: { type: "pressed-input" },
        }),
      (model) =>
        Combobox.update(config, {
          model,
          msg: { type: "pressed-item", item: allItems[0] },
        }),
      (model) =>
        Combobox.update(config, {
          model,
          msg: { type: "pressed-input" },
        }),
      (model) =>
        Combobox.update(config, {
          model,
          msg: { type: "pressed-item", item: allItems[1] },
        })
    );

    expect(Combobox.toSelectedItems(output.model)).toEqual([
      allItems[0],
      allItems[1],
    ]);
  });


  it("clears input when selected", () => {
    const inputtedText = Combobox.chainUpdates(
        {
          model: initMultiSelect(),
          effects: [],
          events: [],
        },
        (model) =>
          Combobox.update(config, {
            model,
            msg: { type: "pressed-input" },
          }),
          (model) =>
        Combobox.update(config, {
            model,
            msg: { type: "inputted-value", inputValue: "Godfather" },
          }),
        
      );

    const selectedItem = Combobox.chainUpdates(
        inputtedText,
        (model) =>
            Combobox.update(config, {
            model,
            msg: { type: "pressed-item", item: Combobox.toFilteredItems(config, model)[0] },
            }),
        );
  
    expect(Combobox.toCurrentInputValue(config, inputtedText.model).length).toBeGreaterThan(0)
    expect(Combobox.toCurrentInputValue(config, selectedItem.model).length).toEqual(0)
  });

  
  
});
