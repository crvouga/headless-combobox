import { describe, expect, it } from "vitest";
import * as Combobox from "../src";

type Item = {
  id: number;
  name: string;
};

const allItems: Item[] = [];
for (let i = 0; i < 100; i++) {
  allItems.push({ id: i, name: `Item ${i}` });
}

const config = Combobox.initConfig<Item>({
  toItemId: (item) => item.id,
  toItemInputValue: (item) => item.name,
});

describe("Combobox Single Select", () => {
  it("open on focus", () => {
    const initial = Combobox.init({
      allItems,
      selectMode: { type: "single-select" },
    });
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    expect(Combobox.isClosed(initial)).toBe(true);
    expect(Combobox.isOpened(focused.model)).toBe(true);
  });

  it("closes on blur", () => {
    const initial = Combobox.init({
      allItems,
      selectMode: { type: "single-select" },
    });
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const blurred = Combobox.update(config, {
      model: initial,
      msg: { type: "blurred-input" },
    });
    expect(Combobox.isClosed(initial)).toBe(true);
    expect(Combobox.isOpened(focused.model)).toBe(true);
    expect(Combobox.isClosed(blurred.model)).toBe(true);
  });

  it("selects an item on press", () => {
    const initial = Combobox.init({
      allItems,
      selectMode: { type: "single-select" },
    });
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const item = allItems[0];
    const selected = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-item", item },
    });
    expect(Combobox.toSelectedItem(initial)).toEqual(null);
    expect(Combobox.toSelectedItem(focused.model)).toEqual(null);
    expect(Combobox.toSelectedItem(selected.model)).toEqual(item);
  });

  it("closes on selects by default", () => {
    const initial = Combobox.init({
      allItems,
      selectMode: { type: "single-select" },
    });
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const item = allItems[0];
    const selected = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-item", item },
    });
    expect(Combobox.isClosed(initial)).toEqual(true);
    expect(Combobox.isOpened(focused.model)).toEqual(true);
    expect(Combobox.isClosed(selected.model)).toEqual(true);
  });

  it("stays open on selects when configured", () => {
    const initial = Combobox.init({
      allItems,
      selectMode: { type: "single-select" },
      disableCloseOnSelect: true,
    });
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const item = allItems[0];
    const selected = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-item", item },
    });
    expect(Combobox.isClosed(initial)).toEqual(true);
    expect(Combobox.isOpened(focused.model)).toEqual(true);
    expect(Combobox.isOpened(selected.model)).toEqual(true);
  });

  it('')
});
