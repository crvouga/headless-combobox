import { describe, expect, it } from "vitest";
import * as Combobox from "../../src";
import { config } from "../shared";
import { initMultiSelect,  pressArrowRight, selectFirstThreeVisibleItems } from "./shared";

describe("combobox multi select keyboard navigation", () => {
  it("highlights first selected item pressing right arrow", () => {
    const output = Combobox.chainUpdates(
      { model: initMultiSelect('left-to-right'), effects: [], events: [] },
      (model) => selectFirstThreeVisibleItems(model),
      (model) => pressArrowRight(model),
    );
    
    const selectedItems = Combobox.toSelectedItems(output.model);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[0]) === 'focused').toBe(true);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[1]) === 'blurred').toBe(true);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[2]) === 'blurred').toBe(true);
  })

  it("highlights second selected item pressing right arrow twice", () => {
    const output = Combobox.chainUpdates(
      { model: initMultiSelect('left-to-right'), effects: [], events: [] },
      (model) => selectFirstThreeVisibleItems(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
    );
    
    const selectedItems = Combobox.toSelectedItems(output.model);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[0]) === 'blurred').toBe(true);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[1]) === 'focused').toBe(true);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[2]) === 'blurred').toBe(true);
  })

  it("highlights third selected item pressing right arrow thrice", () => {
    const output = Combobox.chainUpdates(
      { model: initMultiSelect('left-to-right'), effects: [], events: [] },
      (model) => selectFirstThreeVisibleItems(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
    );
    
    const selectedItems = Combobox.toSelectedItems(output.model);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[0]) === 'blurred').toBe(true);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[1]) === 'blurred').toBe(true);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[2]) === 'focused').toBe(true);
  })

  it("stays highlighting third selected item pressing right arrow more than three times", () => {
    const output = Combobox.chainUpdates(
      { model: initMultiSelect('left-to-right'), effects: [], events: [] },
      (model) => selectFirstThreeVisibleItems(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
    );
    
    const selectedItems = Combobox.toSelectedItems(output.model);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[0]) === 'blurred').toBe(true);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[1]) === 'blurred').toBe(true);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[2]) === 'focused').toBe(true);
  })
});
