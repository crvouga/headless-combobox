import { describe, expect, it } from "vitest";
import * as Combobox from "../src";
import {
  Item,
  allItems,
  config,
  init,
  inputValue,
  pressClearButton,
  pressInput,
  pressItem,
  selectFirstThreeVisibleItems,
  setAllItems,
  setSelectedItems,
} from "./shared";

describe("combobox - preseve selected", () => {
  it("should unselect item when not in all items", () => {
    const initial = init();

    const allItemsWithoutFirst = allItems.slice(1);
    const firstItem = allItems[0];

    const before = Combobox.chainUpdates(
      initial,
      (model) => setAllItems(model, allItems),
      (model) => pressInput(model),
      (model) => pressItem(model, firstItem)
    );

    const after = Combobox.chainUpdates(before, (model) =>
      setAllItems(model, allItemsWithoutFirst)
    );

    expect(Combobox.toSelectedItems(config, before.model)).toEqual([firstItem]);
    expect(Combobox.toSelectedItems(config, after.model)).toEqual([]);
  });

  it("should preserve selected item when not in all items and config is passed", () => {
    const configPreserve: Combobox.Config<Item> = {
      ...config,
      preserveSelected: true,
    };
    const initial = init();

    const firstItem = allItems[0];

    const before = Combobox.chainUpdates(
      initial,
      (model) => setAllItems(model, allItems, configPreserve),
      (model) => pressInput(model, configPreserve),
      (model) => inputValue(model, "123", configPreserve),
      (model) => pressItem(model, firstItem, configPreserve)
    );

    const selectedItems = Combobox.toSelectedItems(configPreserve, before.model);
    const allItemsWithoutSelected = allItems.filter(
      (item) => !selectedItems.some(selectedItem => config.toItemId(selectedItem) === config.toItemId(item))
    );

    expect(selectedItems).toEqual([firstItem]);
    expect(allItemsWithoutSelected).not.toContain(firstItem);
    expect(allItems).toContain(firstItem);
  
    const after = Combobox.chainUpdates(before, 
      (model) => inputValue(model, "456", configPreserve),
      (model) => setAllItems(model, allItemsWithoutSelected, configPreserve),
    );

    expect(Combobox.toSelectedItems(configPreserve, before.model)).toEqual([
      firstItem,
    ]);
    expect(Combobox.toSelectedItems(configPreserve, after.model)).toEqual([
      firstItem,
    ]);
  });

  it("should not clear input value after preserving selected", () => {
    const configPreserve = Combobox.initConfig<Item>({
      ...config,
      preserveSelected: true,
    });

    const initial = init();

    const allItemsWithoutFirst = allItems.slice(1);
    const firstItem = allItems[0];

    const before = Combobox.chainUpdates(
      initial,
      (model) => setAllItems(model, allItems, configPreserve),
      (model) => pressInput(model, configPreserve),
      (model) => pressItem(model, firstItem, configPreserve),
      (model) => inputValue(model, '123', configPreserve)
    );

    

    const after = Combobox.chainUpdates(
      before,
      (model) => pressInput(model, configPreserve),
      (model) => inputValue(model, "456", configPreserve),
      (model) => setAllItems(model, allItemsWithoutFirst, configPreserve)
    );

    expect(Combobox.toCurrentInputValue(configPreserve, before.model)).toEqual(
      "123"
    );
    expect(Combobox.toCurrentInputValue(configPreserve, after.model)).toEqual(
      "456"
    );
  });
});
