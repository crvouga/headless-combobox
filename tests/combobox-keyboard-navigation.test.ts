import { describe, expect, it } from "vitest";
import * as Combobox from "../src";
import { allItems, config, Item } from "./shared";

describe("combobox keyboard navigation", () => {
  it("opens when focused on and arrow up key is pressed", () => {
    const initial = Combobox.init(config, {allItems,});
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const pressedKey = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-vertical-arrow-key", key: "arrow-up" },
    });
    expect(Combobox.isClosed(initial)).toBeTruthy();
    expect(Combobox.isClosed(focused.model)).toBeTruthy();
    expect(Combobox.isOpened(pressedKey.model)).toBeTruthy();
  });

  it("opens when focused on and arrow down key is pressed", () => {
    const initial = Combobox.init(config, {allItems,});
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const pressedKey = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-vertical-arrow-key", key: "arrow-down" },
    });
    expect(Combobox.isClosed(initial)).toBeTruthy();
    expect(Combobox.isClosed(focused.model)).toBeTruthy();
    expect(Combobox.isOpened(pressedKey.model)).toBeTruthy();
  });

  it("stays closed when focused on and arrow left key is pressed", () => {
    const initial = Combobox.init(config, {allItems,});
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const pressedKey = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-horizontal-arrow-key", key: 'arrow-left'  },
    });
    expect(Combobox.isClosed(initial)).toBeTruthy();
    expect(Combobox.isClosed(focused.model)).toBeTruthy();
    expect(Combobox.isOpened(pressedKey.model)).toBe(false);
  });

  it("stays closed when focused on and arrow right key is pressed", () => {
    const initial = Combobox.init(config, {allItems,});
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const pressedKey = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-horizontal-arrow-key", key: 'arrow-right'  },
    });
    expect(Combobox.isClosed(initial)).toBeTruthy();
    expect(Combobox.isClosed(focused.model)).toBeTruthy();
    expect(Combobox.isOpened(pressedKey.model)).toBe(false);
  });

  it('closes when focused on and escape key is pressed', () => {
    const initial = Combobox.init(config, {allItems,});
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const pressedKey = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-escape-key" },
    });
    expect(Combobox.isClosed(initial)).toBeTruthy();
    expect(Combobox.isClosed(focused.model)).toBeTruthy();
    expect(Combobox.isClosed(pressedKey.model)).toBeTruthy();
  })

  it('opens on when focused and on first arrow down key but does not highlight any item', () => {
    const initial = Combobox.init(config, {allItems,});
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const pressedArrowDown = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
    });
    expect(Combobox.isClosed(initial)).toBeTruthy();
    expect(Combobox.isClosed(focused.model)).toBeTruthy();
    expect(Combobox.isOpened(pressedArrowDown.model)).toBeTruthy();
    expect(Combobox.toHighlightedItem(config, pressedArrowDown.model)).toBe(null);
  })

  it('opens on first key down then highlights first item', () => {
    const initial = Combobox.init(config, {allItems,});
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const pressedArrowDown = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
    });
    const pressedArrowDownAgain = Combobox.update(config, {
      model: pressedArrowDown.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
    });
    expect(Combobox.toHighlightedIndex(focused.model)).toBe(-1);
    expect(Combobox.toHighlightedIndex(pressedArrowDown.model)).toBe(-1);
    expect(Combobox.toHighlightedIndex(pressedArrowDownAgain.model)).toBe(0);
  })

  it('highlights the next item when arrow down key is pressed', () => {
    const initial = Combobox.init(config, {allItems,});
    const pressedInput = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    const pressedArrowDown = Combobox.update(config, {
      model: pressedInput.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
    });
    const pressedArrowDownAgain = Combobox.update(config, {
      model: pressedArrowDown.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
    });
    expect(Combobox.toHighlightedIndex(pressedInput.model)).toBe(-1);
    expect(Combobox.toHighlightedIndex(pressedArrowDown.model)).toBe(0);
    expect(Combobox.toHighlightedIndex(pressedArrowDownAgain.model)).toBe(1);
  })

  it('highlights the previous item when arrow up key is pressed', () => {
    const initial = Combobox.init(config, {allItems,});
    const pressedInput = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    const pressedArrowDown = Combobox.update(config, {
      model: pressedInput.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
    });
    const pressedArrowDownAgain = Combobox.update(config, {
      model: pressedArrowDown.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
    });
    const pressedArrowUp = Combobox.update(config, {
      model: pressedArrowDownAgain.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-up' },
    });
    
    expect(Combobox.toHighlightedIndex(pressedInput.model)).toBe(-1);
    expect(Combobox.toHighlightedIndex(pressedArrowDown.model)).toBe(0);
    expect(Combobox.toHighlightedIndex(pressedArrowDownAgain.model)).toBe(1);
    expect(Combobox.toHighlightedIndex(pressedArrowUp.model)).toBe(0);
  })

  it('selects highlighted index when enter key is pressed', () => {
    const initial = Combobox.init(config, {allItems,});
    const {pressedArrowDownAgain,pressedEnterKey} = selectSecondItemWithKeyboard(initial);
    expect(Combobox.toSelectedItem(config, pressedArrowDownAgain.model)).toBe(null);
    expect(Combobox.toSelectedItem(config, pressedEnterKey.model)).toBe(allItems[1]);
  })

  it('closes when selecting with enter key', () => {
    const initial = Combobox.init(config, {allItems,});
    const {pressedArrowDownAgain,pressedEnterKey} = selectSecondItemWithKeyboard(initial);
    expect(Combobox.isOpened(pressedArrowDownAgain.model)).toBeTruthy();
    expect(Combobox.isClosed(pressedEnterKey.model)).toBeTruthy();
  })

  it('starts highlighed index from selected index - arrow down', () => {
    const initial = Combobox.init(config, {allItems,});
    const {pressedEnterKey} = selectSecondItemWithKeyboard(initial);
    const pressedArrowDown = Combobox.update(config, {
      model: pressedEnterKey.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
    });
    const pressedArrowDownAgain = Combobox.update(config, {
      model: pressedArrowDown.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
    });

    expect(Combobox.toHighlightedIndex(pressedArrowDown.model)).toBe(-1);
    expect(Combobox.toHighlightedIndex(pressedArrowDownAgain.model)).toBe(2);
  })

  it('starts highlighed index from selected index - arrow down', () => {
    const initial = Combobox.init(config, {allItems,});
    const {pressedEnterKey} = selectSecondItemWithKeyboard(initial);
    const pressedArrowUp = Combobox.update(config, {
      model: pressedEnterKey.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-up' },
    });
    const pressedArrowUpAgain = Combobox.update(config, {
      model: pressedArrowUp.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-up' },
    });
    expect(Combobox.toHighlightedIndex(pressedArrowUp.model)).toBe(-1);
    expect(Combobox.toHighlightedIndex(pressedArrowUpAgain.model)).toBe(0);
  })

  it(`sets input value to selected item's input value on select`, () => {
    const initial = Combobox.init(config, {allItems,});
    const {pressedArrowDownAgain, pressedEnterKey} = selectSecondItemWithKeyboard(initial);
    expect(Combobox.toCurrentInputValue(config, pressedArrowDownAgain.model)).toBe('');
    const selectedItem = Combobox.toSelectedItem(config, pressedEnterKey.model);
    if(selectedItem === null) throw new Error('selectedItem is null')
    expect(Combobox.toCurrentInputValue(config,pressedEnterKey.model)).toBe(config.toItemInputValue(selectedItem));
  })

  it('does not circle back to last item when on first item and arrow up key is pressed by default', () => {
    const initial = Combobox.init(config, {allItems,});
    const pressedInput = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    const pressedArrowDown = Combobox.update(config, {
      model: pressedInput.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
    });
    const pressedArrowUp = Combobox.update(config, {
      model: pressedArrowDown.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-up' },
    });
    expect(Combobox.toHighlightedIndex(pressedInput.model)).toBe(-1);
    expect(Combobox.toHighlightedIndex(pressedArrowDown.model)).toBe(0);
    expect(Combobox.toHighlightedIndex(pressedArrowUp.model)).toBe(0);
  })

  it('does circle back to last item when on first item and arrow up key is pressed', () => {
    const initial = Combobox.init(config, {allItems,highlightMode: {type: 'circular'}});
    const pressedInput = Combobox.update(config, {
      model: initial,
      msg: { type: "pressed-input" },
    });
    const pressedArrowDown = Combobox.update(config, {
      model: pressedInput.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
    });
    const pressedArrowUp = Combobox.update(config, {
      model: pressedArrowDown.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-up' },
    });
    expect(Combobox.toHighlightedIndex(pressedInput.model)).toBe(-1);
    expect(Combobox.toHighlightedIndex(pressedArrowDown.model)).toBe(0);
    const lastIndex = Combobox.toRenderItems(config, pressedArrowUp.model).length - 1
    expect(Combobox.toHighlightedIndex(pressedArrowUp.model)).toBe(lastIndex);
  })

  it('does not circle back to first item when on last item and arrow down key is pressed by default', () => {
    const initial = Combobox.init(config, {allItems,});
    const {highligtedLastItem, lastIndex} = navigatedDownToLastItem(initial);
    const pressedArrowDown = Combobox.update(config, {
      model: highligtedLastItem.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
    });
    expect(Combobox.toHighlightedIndex(highligtedLastItem.model)).toBe(lastIndex);
    expect(Combobox.toHighlightedIndex(pressedArrowDown.model)).toBe(lastIndex);
  })

  it('does circle back to first item when on last item and arrow down key is pressed', () => {
    const initial = Combobox.init(config, {allItems,highlightMode: {type: 'circular'}});
    const {highligtedLastItem, lastIndex} = navigatedDownToLastItem(initial);
    const pressedArrowDown = Combobox.update(config, {
      model: highligtedLastItem.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
    });
    expect(Combobox.toHighlightedIndex(highligtedLastItem.model)).toBe(lastIndex);
    expect(Combobox.toHighlightedIndex(pressedArrowDown.model)).toBe(0);
  })
});


function navigatedDownToLastItem(initial: Combobox.Model<Item>) {
  const pressedInput = Combobox.update(config, {
    model: initial,
    msg: { type: "pressed-input" },
  });
  const lastIndex = Combobox.toRenderItems(config, pressedInput.model).length - 1
  let highligtedLastItem = pressedInput;
  for(let i = 0; i <= lastIndex; i++) {
    highligtedLastItem = Combobox.update(config, {
      model: highligtedLastItem.model,
      msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
    });
  }

  return  {
    lastIndex,
    initial,
    pressedInput,
    highligtedLastItem,
  }
}

function selectSecondItemWithKeyboard(initial: Combobox.Model<Item>) {
  const pressedInput = Combobox.update(config, {
    model: initial,
    msg: { type: "pressed-input" },
  });
  const pressedArrowDown = Combobox.update(config, {
    model: pressedInput.model,
    msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
  });
  const pressedArrowDownAgain = Combobox.update(config, {
    model: pressedArrowDown.model,
    msg: { type: "pressed-vertical-arrow-key", key: 'arrow-down' },
  });
  const pressedEnterKey = Combobox.update(config, {
    model: pressedArrowDownAgain.model,
    msg: { type: "pressed-enter-key", },
  });
  return {
    initial,
    pressedInput,
    pressedArrowDown,
    pressedArrowDownAgain,
    pressedEnterKey,
  }
}