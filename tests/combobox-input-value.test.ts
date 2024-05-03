import { describe, expect, it } from "vitest";
import * as Combobox from "../src";
import {
  allItems,
  config,
  inputValue,
  pressInput,
  pressItem,
  setSelectedItems
} from "./shared";

describe("combobox input value", () => {
  it("should not reset input value after setting selected items when there is already something selected", () => {
    const initial = Combobox.init(config, {
      allItems,
      selectMode: { type: "single-select" },
    });
    const item = { ...allItems[0] };

    const output = Combobox.chainUpdates(
      {
        model: initial,
        effects: [],
        events: [],
      },
      (model) => pressInput(model),
      (model) => pressItem(model, item),
      (model) => inputValue(model, item.label.substring(0, 1)),
      (model) => setSelectedItems(model, [item])
    );
    const expected = item.label.substring(0, 1);
    const actual = Combobox.toState(config, output.model).inputValue;
    expect(actual).toEqual(expected);
  });

  it("should set search value to input value when selected item is set when selected items is empty", () => {
    const initial = Combobox.init(config, {
      allItems,
    });

    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];

    const output = Combobox.chainUpdates(
      {
        model: initial,
        effects: [],
        events: [],
      },
      (model) => pressInput(model),
      (model) => setSelectedItems(model, [randomItem]),
      (model) => pressInput(model)
    );

    const before = Combobox.toSearchValue(initial);
    const expected = config.toItemInputValue(randomItem);
    const actualSearchValue = Combobox.toSearchValue(output.model);
    const actualInputValue = Combobox.toState(config, output.model).inputValue;

    expect(before).toEqual("");
    expect(actualSearchValue).toEqual(expected);
    expect(actualInputValue).toEqual(expected);
  });
});
