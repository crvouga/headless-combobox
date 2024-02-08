import { describe, expect, it } from "vitest";
import * as Combobox from "../src";
import { allItems, config } from "./shared";

describe("combobox", () => {
  it("is focused on focus", () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    expect(Combobox.isBlurred(initial)).toBe(true);
    expect(Combobox.isFocused(focused.model)).toBe(true);
  });

  it("is closed on focus", () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    expect(Combobox.isBlurred(initial)).toBe(true);
    expect(Combobox.isClosed(focused.model)).toBe(true);
  });

  it("opens on press", () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const pressed = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    expect(Combobox.isClosed(initial)).toBe(true);
    expect(Combobox.isOpened(pressed.model)).toBe(true);
  });

  it("is focused on press", () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const pressed = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    expect(Combobox.isBlurred(initial)).toBe(true);
    expect(Combobox.isFocused(pressed.model)).toBe(true);
  });

  it("outputs focus effect on press", () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const pressed = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    expect(pressed.effects).toContainEqual({ type: "focus-input" });
  });

  it("remains focused when focused again after pressed", () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const pressed = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    const focused = Combobox.update(config, {
      model: pressed.model,
      msg: { type: "focused-input" },
    });
    expect(Combobox.isBlurred(initial)).toBe(true);
    expect(Combobox.isFocused(pressed.model)).toBe(true);
    expect(Combobox.isFocused(focused.model)).toBe(true);
  });

  it("closes on blur", () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const pressed = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    const blurred = Combobox.update(config, {
      model: initial,
      msg: { type: "blurred-input" },
    });
    expect(Combobox.isClosed(initial)).toBe(true);
    expect(Combobox.isOpened(pressed.model)).toBe(true);
    expect(Combobox.isClosed(blurred.model)).toBe(true);
  });

  it("selects an item on press", () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const pressed = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    const item = allItems[0];
    const selected = Combobox.update(config, {
      model: pressed.model,
      msg: { type: "pressed-item", item },
    });
    expect(Combobox.toSelectedItem(initial)).toEqual(null);
    expect(Combobox.toSelectedItem(pressed.model)).toEqual(null);
    expect(Combobox.toSelectedItem(selected.model)).toEqual(item);
  });

  it("closes on selects by default", () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const pressed = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    const item = allItems[0];
    const selected = Combobox.update(config, {
      model: pressed.model,
      msg: { type: "pressed-item", item },
    });
    expect(Combobox.isClosed(initial)).toEqual(true);
    expect(Combobox.isOpened(pressed.model)).toEqual(true);
    expect(Combobox.isClosed(selected.model)).toEqual(true);
  });

  it("stays open on selects when configured", () => {
    const initial = Combobox.init(config, {
      allItems,

      disableCloseOnSelect: true,
    });
    const pressed = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    const item = allItems[0];
    const selected = Combobox.update(config, {
      model: pressed.model,
      msg: { type: "pressed-item", item },
    });
    expect(Combobox.isClosed(initial)).toEqual(true);
    expect(Combobox.isOpened(pressed.model)).toEqual(true);
    expect(Combobox.isOpened(selected.model)).toEqual(true);
  });

  it("closes on select but is still focused", () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const pressed = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    const item = allItems[0];
    const selected = Combobox.update(config, {
      model: pressed.model,
      msg: { type: "pressed-item", item },
    });

    expect(Combobox.isBlurred(initial)).toEqual(true);
    expect(Combobox.isFocused(pressed.model)).toEqual(true);
    expect(Combobox.isClosed(selected.model)).toEqual(true);
    expect(Combobox.isFocused(selected.model)).toEqual(true);
  });

  it("shows all items when input value is empty", () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const FilteredItems = Combobox.toFilteredItems(config,initial);
    expect(FilteredItems).toEqual(allItems);
  });

  it("opens when search is inputted", () => {
    const initial = Combobox.init(config, {
      allItems,
    });

    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });

    const inputted = Combobox.update(config, {
      model: focused.model,
      msg: { type: "inputted-value", inputValue: "a" },
    });

    expect(Combobox.isClosed(initial)).toEqual(true);
    expect(Combobox.isOpened(inputted.model)).toEqual(true);  
  });

  it('filters items when search is inputted', () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const inputted = Combobox.update(config, {
      model: focused.model,
      msg: { type: "inputted-value", inputValue: "star wars" },
    });
    const FilteredItems = Combobox.toFilteredItems(config,inputted.model);
    const filteredItems = allItems.filter(item => item.label.toLowerCase().includes("star wars"));
    expect(FilteredItems).toEqual(filteredItems);
  })

  it('should reset highlighted index when search is inputted', () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const pressedInput = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    
    const hovered = Combobox.update(config, {
      model: pressedInput.model,
      msg: { type: "hovered-over-item", index: 2 },
    });

    const inputted = Combobox.update(config, {
      model: hovered.model,
      msg: { type: "inputted-value", inputValue: "star wars" },
    });

    expect(Combobox.toHighlightedIndex(pressedInput.model)).toEqual(-1);
    expect(Combobox.toHighlightedIndex(hovered.model)).toEqual(2);
    expect(Combobox.toHighlightedIndex(inputted.model)).toEqual(-1);
  })

  it('scrolls item into view when opened', () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const pressedInput = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    const pressedItem = Combobox.update(config, {
      model: pressedInput.model,
      msg: { type: "pressed-item", item:  randomItem },
    });
    expect(Combobox.isClosed(initial)).toEqual(true);
    expect(Combobox.isOpened(pressedInput.model)).toEqual(true);
    // expect(pressedInput.effects).toContainEqual({ type: "scroll-into-view", index: 0 });
  })

  it('sets input value to selected item name on select', () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    const pressedInput = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    const pressedItem = Combobox.update(config, {
      model: pressedInput.model,
      msg: { type: "pressed-item", item:  randomItem },
    });
    expect(Combobox.toCurrentInputValue(config, pressedItem.model)).toEqual(config.toItemInputValue(randomItem));
  })


  it('should unselect an item if its not part of all items', () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    
    const pressedInput = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    
    const selectedItem = Combobox.update(config, {
      model: pressedInput.model,
      msg: { type: "pressed-item", item:  randomItem },
    });
    
    // 
    const removeSelectedItem = Combobox.update(config, {
      model: selectedItem.model,
      msg: { type: "set-all-items", allItems: allItems.filter(item => config.toItemId(item) !== config.toItemId(randomItem)) },
    });

    expect(Combobox.toSelectedItem(selectedItem.model)).toEqual(randomItem); 
    expect(Combobox.toCurrentInputValue(config, selectedItem.model)).toEqual(config.toItemInputValue(randomItem));

    expect(Combobox.toSelectedItem(removeSelectedItem.model)).toEqual(null);
    expect(Combobox.toCurrentInputValue(config, removeSelectedItem.model)).toEqual("");
  })

  it('should set input value to selected item name on select', () => {
    const initial = Combobox.init(config, {
      allItems,
    });
    
    const pressedInput = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    
    const selectedItem = Combobox.update(config, {
      model: pressedInput.model,
      msg: { type: "pressed-item", item:  randomItem },
    });
    
    expect(Combobox.toCurrentInputValue(config, pressedInput.model)).toEqual("");
    expect(Combobox.toCurrentInputValue(config, selectedItem.model)).toEqual(config.toItemInputValue(randomItem));
    
  })
});
