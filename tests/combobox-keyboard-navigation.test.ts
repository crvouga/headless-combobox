import { describe, expect, it } from "vitest";
import * as Combobox from "../src";
import { allItems, config } from "./shared";


describe("combobox keyboard navigation", () => {
  it("opens when focused on and arrow up key is pressed", () => {
    const initial = Combobox.init({allItems,});
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const pressedKey = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-vertical-arrow-key", key: "arrow-up" },
    });
    expect(Combobox.isClosed(initial)).toBe(true);
    expect(Combobox.isClosed(focused.model)).toBe(true);
    expect(Combobox.isOpened(pressedKey.model)).toBe(true);
  });

  it("opens when focused on and arrow down key is pressed", () => {
    const initial = Combobox.init({allItems,});
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const pressedKey = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-vertical-arrow-key", key: "arrow-down" },
    });
    expect(Combobox.isClosed(initial)).toBe(true);
    expect(Combobox.isClosed(focused.model)).toBe(true);
    expect(Combobox.isOpened(pressedKey.model)).toBe(true);
  });

  it("stays closed when focused on and arrow left key is pressed", () => {
    const initial = Combobox.init({allItems,});
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const pressedKey = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-horizontal-arrow-key", key: 'arrow-left'  },
    });
    expect(Combobox.isClosed(initial)).toBe(true);
    expect(Combobox.isClosed(focused.model)).toBe(true);
    expect(Combobox.isOpened(pressedKey.model)).toBe(false);
  });

  it("stays closed when focused on and arrow right key is pressed", () => {
    const initial = Combobox.init({allItems,});
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const pressedKey = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-horizontal-arrow-key", key: 'arrow-right'  },
    });
    expect(Combobox.isClosed(initial)).toBe(true);
    expect(Combobox.isClosed(focused.model)).toBe(true);
    expect(Combobox.isOpened(pressedKey.model)).toBe(false);
  });

  it('closes when focused on and escape key is pressed', () => {
    const initial = Combobox.init({allItems,});
    const focused = Combobox.update(config, {
      model: initial,
      msg: { type: "focused-input" },
    });
    const pressedKey = Combobox.update(config, {
      model: focused.model,
      msg: { type: "pressed-escape-key" },
    });
    expect(Combobox.isClosed(initial)).toBe(true);
    expect(Combobox.isClosed(focused.model)).toBe(true);
    expect(Combobox.isClosed(pressedKey.model)).toBe(true);
  })

});
