import { describe, expect, it } from "vitest";
import * as Combobox from "../../src";
import { blurInput, config, focusInput, initMultiSelect, inputValue, pressArrowDown, pressArrowLeft, pressArrowRight, pressArrowUp, pressBackspace, pressEscape, pressInput, selectFirstThreeVisibleItems } from "../shared";

const initial = { model: initMultiSelect('left-to-right'), effects: [], events: [] }

describe("combobox multi select keyboard navigation", () => {
  it("focuses on first selected item pressing right arrow", () => {
    const output = Combobox.chainUpdates(
      initial,
      (model) => selectFirstThreeVisibleItems(model),
      (model) => pressArrowRight(model),
    );
    
    const selectedItems = Combobox.toSelectedItems(config, output.model);
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
    
    const selectedItems = Combobox.toSelectedItems(config, output.model);
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
    
    const selectedItems = Combobox.toSelectedItems(config, output.model);
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
    
    const selectedItems = Combobox.toSelectedItems(config, output.model);
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
    
    const selectedItems = Combobox.toSelectedItems(config, output.model);
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
      (model) => pressArrowDown(model),
      (model) => pressArrowDown(model),
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
    expect(Combobox.toSelectedItems(config, selectedFirstThree.model)).toHaveLength(3);
    expect(Combobox.toSelectedItems(config, deletedFirst.model)).toHaveLength(2);
  })


  it("deletes first selected item pressing backspace", () => {
    const selectedThree = Combobox.chainUpdates(initial, (model) => selectFirstThreeVisibleItems(model))
    const pressedBackspace = Combobox.chainUpdates(
      selectedThree,
      (model) => blurInput(model),
      (model) => pressInput(model),
      (model) => pressBackspace(model),
    );
    expect(Combobox.toSelectedItems(config, selectedThree.model)).toHaveLength(3);
    expect(Combobox.toSelectedItems(config, pressedBackspace.model)).toHaveLength(2);
  })

  it("deletes first two selected items pressing backspace twice", () => {
    const selectedThree = Combobox.chainUpdates(
      initial, 
      (model) => selectFirstThreeVisibleItems(model)
    )
    const pressedBackspaceTwice = Combobox.chainUpdates(
      selectedThree,
      (model) => blurInput(model),
      (model) => pressInput(model),
      (model) => pressBackspace(model),
      (model) => pressBackspace(model),
    );
    expect(Combobox.toSelectedItems(config, selectedThree.model)).toHaveLength(3);
    expect(Combobox.toSelectedItems(config, pressedBackspaceTwice.model)).toHaveLength(1);
  })

  it("stays open while deleting with backspace", () => {
    const selectedThree = Combobox.chainUpdates(
      initial, 
      (model) => selectFirstThreeVisibleItems(model),
      (model) => blurInput(model),
      (model) => pressInput(model),
    )
    const pressedBackspace = Combobox.chainUpdates(
      selectedThree,
      (model) => pressBackspace(model),
    );
    expect(Combobox.isOpened(selectedThree.model)).toBe(true);
    expect(Combobox.isOpened(pressedBackspace.model)).toBe(true);
  })


  it("stays closed while deleting with backspace", () => {
    const selectedThree = Combobox.chainUpdates(
      initial, 
      (model) => selectFirstThreeVisibleItems(model),
      (model) => blurInput(model),
      (model) => focusInput(model),
    )
    const pressedBackspace = Combobox.chainUpdates(
      selectedThree,
      (model) => pressBackspace(model),
    );
    expect(Combobox.isClosed(selectedThree.model)).toBe(true);
    expect(Combobox.isClosed(pressedBackspace.model)).toBe(true);
  })

  it("prevents navigation of selected items when input is not empty", () => {
    const selectedThree = Combobox.chainUpdates(
      initial, 
      (model) => selectFirstThreeVisibleItems(model),
      (model) => blurInput(model),
      (model) => focusInput(model),
      (model) => inputValue(model, 'a'),
    )
    const navigatedWithKeyboard = Combobox.chainUpdates(
      selectedThree,
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),
    );
    expect(Combobox.isSelectedItemHighlighted(selectedThree.model)).toBe(false);
    expect(Combobox.isSelectedItemHighlighted(navigatedWithKeyboard.model)).toBe(false);
  })

  it("prevents deleting selected item when input is not empty", () => {
    const selectedThree = Combobox.chainUpdates(
      initial, 
      (model) => selectFirstThreeVisibleItems(model),
      (model) => blurInput(model),
      (model) => focusInput(model),
      (model) => inputValue(model, 'foo bar baz'),
    )
    const pressedBackspaceALot = Combobox.chainUpdates(
      selectedThree,
      (model) => pressBackspace(model),
      (model) => pressBackspace(model),
      (model) => pressBackspace(model),
      (model) => pressBackspace(model),
      (model) => pressBackspace(model),
    );
    expect(Combobox.toSelectedItems(config, selectedThree.model).length).toBe(3);
    expect(Combobox.toSelectedItems(config, pressedBackspaceALot.model).length).toBe(3);
  })


  it("stops navigating selected items with keyboard when something is inputted", () => {
    const focusedSecondSelectedItem = Combobox.chainUpdates(
      initial, 
      (model) => selectFirstThreeVisibleItems(model),
      (model) => pressArrowRight(model),
      (model) => pressArrowRight(model),  
    )
    const inputtedSomething = Combobox.chainUpdates(
      focusedSecondSelectedItem,
      model => inputValue(model, 'a'),
    );
    expect(Combobox.isSelectedItemHighlighted(focusedSecondSelectedItem.model)).toBe(true);
    expect(Combobox.isSelectedItemHighlighted(inputtedSomething.model)).toBe(false);
  })


});

