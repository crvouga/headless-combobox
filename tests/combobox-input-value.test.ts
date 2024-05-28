import { describe, expect, it } from "vitest";
import * as Combobox from "../src";
import {
  allItems,
  blurInput,
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

  it("should not reset input value after setting selected items when there is already something selected", () => {
    const initial = Combobox.init(config, {
      allItems,
      selectMode: { type: "single-select" },
    });
    const itemA = { ...allItems[0] };
    const itemB = { ...allItems[1] };

    const output = Combobox.chainUpdates(
      {
        model: initial,
        effects: [],
        events: [],
      },
      (model) => pressInput(model),
      (model) => pressItem(model, itemA),
      (model) => inputValue(model, itemA.label.substring(0, 1)),
      (model) => setSelectedItems(model, [itemB])
    );
    const expected = itemA.label.substring(0, 1);
    const actual = Combobox.toState(config, output.model).inputValue;
    expect(actual).toEqual(expected);
  })

  it('should reset input value after setting selected items when input is blurred', () => {
    const initial = Combobox.init(config, {
      allItems,
      selectMode: { type: "single-select" },
    });
    const itemA = { ...allItems[0] };
    const itemB = { ...allItems[1] };
    

    const before = Combobox.chainUpdates(
      {
        model: initial,
        effects: [],
        events: [],
      },
      (model) => pressInput(model),
      (model) => pressItem(model, itemA),
      (model) => inputValue(model, itemA.label.substring(0, 1)),
    );
    const after = Combobox.chainUpdates(
      before,
      (model) => setSelectedItems(model, [itemB]),
      (model) => blurInput(model),
    )

    expect(Combobox.toState(config, before.model).inputValue).toEqual(itemA.label.substring(0, 1));
    expect(Combobox.toState(config, after.model).inputValue).toEqual(itemB.label);
  })

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


  it('should clear input value when nothing is selected and input is blurred', () => {
    const initial = Combobox.init(config, {
      allItems,
    });

    const output = Combobox.chainUpdates(
      {
        model: initial,
        effects: [],
        events: [],
      },
      (model) => pressInput(model),
      (model) => inputValue(model, 'a'),
      (model) => blurInput(model),
      (model) => pressInput(model),
    );

    const expected = '';
    const actual = Combobox.toState(config, output.model).inputValue;
    expect(actual).toEqual(expected);
  })

  it('should set input value to selected item when input is blurred', () => {
    const initial = Combobox.init(config, {
      allItems,
      selectMode: { type: 'single-select' }
    });

    const item = allItems[0];

    const output = Combobox.chainUpdates(
      {
        model: initial,
        effects: [],
        events: [],
      },
      (model) => pressInput(model),
      (model) => pressItem(model, item),
      (model) => blurInput(model),
      (model) => pressInput(model),
    );

    const expected = config.toItemInputValue(item);
    const actual = Combobox.toState(config, output.model).inputValue;
    expect(actual).toEqual(expected);
  })

  it('should set input value to selected item when input is blurred and there is a search value', () => {
    const initial = Combobox.init(config, {
      allItems,
      selectMode: { type: 'single-select' }
    });

    const selectedItem = allItems[0];

    const output = Combobox.chainUpdates(
      {
        model: initial,
        effects: [],
        events: [],
      },
      (model) => pressInput(model),
      (model) => pressItem(model, selectedItem),
      (model) => inputValue(model, 'a'),
      (model) => blurInput(model),
      (model) => pressInput(model),
    );

    const expected = config.toItemInputValue(selectedItem);
    const actual = Combobox.toState(config, output.model).inputValue;
    expect(actual).toEqual(expected);
  })
});
