import { describe, expect, it } from "vitest";
import * as Combobox from "../src";
import { allItems, config, inputValue, pressInput, pressItem } from "./shared";

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
    expect(Combobox.toSelectedItems(config, initial).length).toBe(0);
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

    expect(Combobox.toSelectedItems(config, output.model)).toEqual([
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

  it("selected items should always be in order of selection", () => {
    const output = Combobox.chainUpdates(
      {
        model: initMultiSelect(),
        effects: [],
        events: [],
      },
      pressInput,
      (model) => pressItem(model, allItems[0]),
      pressInput,
      (model) => pressItem(model, allItems[1]),
      pressInput,
      (model) => pressItem(model, allItems[2]),
      pressInput,
      (model) => pressItem(model, allItems[3]),
    );

    expect(Combobox.toSelectedItems(config, output.model)).toEqual([
      allItems[0],
      allItems[1],
      allItems[2],
      allItems[3],
    ]);
  })  


  it("selected items should always be in order of selection even after inputting", () => {
    const output = Combobox.chainUpdates(
      {
        model: initMultiSelect(),
        effects: [],
        events: [],
      },
      pressInput,
      (model) => pressItem(model, allItems[0]),
      pressInput,
      (model) => pressItem(model, allItems[1]),
      pressInput,
      (model) => pressItem(model, allItems[2]),
      pressInput,
      (model) =>  inputValue(model, "Godfather"), 
      (model) => pressItem(model, allItems[3]),
      (model) =>  inputValue(model, "G"), 
    );

    expect(Combobox.toSelectedItems(config, output.model)).toEqual([
      allItems[0],
      allItems[1],
      allItems[2],
      allItems[3],
    ]);
  })

  it("should sort selected items using the sort comparator passed in the config", () => {
    const output = Combobox.chainUpdates(
      {
        model: initMultiSelect(),
        effects: [],
        events: [],
      },
      pressInput,
      (model) => pressItem(model, allItems[0]),
      pressInput,
      (model) => pressItem(model, allItems[1]),
      pressInput,
      (model) => pressItem(model, allItems[2]),
      pressInput,
      (model) =>  inputValue(model, "Godfather"), 
      (model) => pressItem(model, allItems[3]),
      (model) =>  inputValue(model, "G"), 
    );

    const configWithSort: typeof config = {
      ...config,
      sortSelectedItems(a, b) {
        return a.year - b.year;
      },
    }

    const unsorted  =[
      allItems[0],
      allItems[1],
      allItems[2],
      allItems[3],
    ]
    const expected = [
      ...unsorted
    ].sort(configWithSort.sortSelectedItems).reverse()

    const actual = Combobox.toSelectedItems(configWithSort, output.model)
  
    expect(actual).toEqual(expected);
  })
  
});
