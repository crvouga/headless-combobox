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
  it('should unselect item when not in all items', () => {
    const initial = init();

    const allItemsWithoutFirst = allItems.slice(1);
    const firstItem = allItems[0];

    const before = Combobox.chainUpdates(
      initial,
      (model) => setAllItems(model, allItems),
      (model) => pressInput(model),
      (model) => pressItem(model, firstItem),
    );

    const after = Combobox.chainUpdates(
      before,
      (model) => setAllItems(model, allItemsWithoutFirst),
    );

    expect(Combobox.toSelectedItems(config, before.model)).toEqual([firstItem]);
    expect(Combobox.toSelectedItems(config, after.model)).toEqual([]);
  })

  it('should preserve selected item when not in all items and config is passed', () => {
    const configPreserve: Combobox.Config<Item> = {
      ...config,
      preserveSelected: true,
    }
    const initial = init();

    const allItemsWithoutFirst = allItems.slice(1);
    const firstItem = allItems[0];

    const before = Combobox.chainUpdates(
      initial,
      (model) => setAllItems(model, allItems, configPreserve),
      (model) => pressInput(model, configPreserve),
      (model) => pressItem(model, firstItem, configPreserve),
    );

    const after = Combobox.chainUpdates(
      before,
      (model) => setAllItems(model, allItemsWithoutFirst, configPreserve),
    );

    expect(Combobox.toSelectedItems(configPreserve, before.model)).toEqual([firstItem]);
    expect(Combobox.toSelectedItems(configPreserve, after.model)).toEqual([firstItem]);
  })
  
});
