import { describe, expect, it } from "vitest";
import * as Combobox from "../../src";
import { config } from "../shared";
import { initMultiSelect,  pressArrowDown,  pressArrowLeft,  pressArrowRight, pressArrowUp, pressBackspace, pressEscape, selectFirstThreeVisibleItems } from "./shared";

const initial = { model: initMultiSelect('left-to-right'), effects: [], events: [] }

describe("combobox multi select keyboard navigation", () => {
  it("focuses on first selected item pressing right arrow", () => {
    const output = Combobox.chainUpdates(
      initial,
      (model) => selectFirstThreeVisibleItems(model),
      (model) => pressArrowRight(model),
    );
    
    const selectedItems = Combobox.toSelectedItems(output.model);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[0]) === 'focused').toBe(true);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[1]) === 'blurred').toBe(true);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[2]) === 'blurred').toBe(true);
  })
  

  it("focuses on second selected item pressing right arrow twice", () => {
    const output = Combobox.chainUpdates(
      initial,
      (model) => selectFirstThreeVisibleItems(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
    );
    
    const selectedItems = Combobox.toSelectedItems(output.model);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[0]) === 'blurred').toBe(true);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[1]) === 'focused').toBe(true);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[2]) === 'blurred').toBe(true);
  })
  

  it("focuses on third selected item pressing right arrow thrice", () => {
    const output = Combobox.chainUpdates(
      initial,
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
  

  it("stays focusing third selected item pressing right arrow more than three times", () => {
    const output = Combobox.chainUpdates(
      initial,
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
  

  it("focuses on second selected item pressing left arrow when on focusing third", () => {
    const output = Combobox.chainUpdates(
      initial,
      (model) => selectFirstThreeVisibleItems(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowLeft(model),
    );
    
    const selectedItems = Combobox.toSelectedItems(output.model);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[0]) === 'blurred').toBe(true);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[1]) === 'focused').toBe(true);
    expect(Combobox.toSelectedItemStatus(config, output.model, selectedItems[2]) === 'blurred').toBe(true);
  })
  

  it("stops keyboard navigation for selected items when pressing arrow up", () => {
    const output = Combobox.chainUpdates(
      initial,
      (model) => selectFirstThreeVisibleItems(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowUp(model),

    );
    expect(Combobox.isFocused(output.model)).toBe(true);
    expect(Combobox.isOpened(output.model)).toBe(true);
  })

  

  it("stops keyboard navigation for selected items when pressing arrow down", () => {
    const output = Combobox.chainUpdates(
      initial,
      (model) => selectFirstThreeVisibleItems(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowDown(model),
    );
    expect(Combobox.isFocused(output.model)).toBe(true);
    expect(Combobox.isOpened(output.model)).toBe(true);
  })
  

  it("stops keyboard navigation for selected items when pressing escape", () => {
    const output = Combobox.chainUpdates(
      initial,
      (model) => selectFirstThreeVisibleItems(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
      (model) => pressEscape(model),
    );
    expect(Combobox.isFocused(output.model)).toBe(true);
    expect(Combobox.isClosed(output.model)).toBe(true);
  })


  it("deletes selected items when pressing backspace", () => {
    const selectedFirstThree = Combobox.chainUpdates(
      initial,
      (model) => selectFirstThreeVisibleItems(model),
    );
    const deletedFirst = Combobox.chainUpdates(
      selectedFirstThree,
      (model)  => pressArrowRight(model),
      (model)  => pressBackspace(model),
    );
    expect(Combobox.toSelectedItems(selectedFirstThree.model)).toHaveLength(3);
    expect(Combobox.toSelectedItems(deletedFirst.model)).toHaveLength(2);
  })

});

