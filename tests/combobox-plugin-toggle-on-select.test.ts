import { describe, expect, it } from "vitest";
import * as Combobox from "../src";
import { allItems, config } from "./shared";



describe("combobox plugin toggle on select", () => {
  it('unselects item if selected again', () => {
    const initial = Combobox.init(config, {
      allItems,
      selectMode: { type: "single-select" },
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
    const unselected = Combobox.update(config, {
      model: selected.model,
      msg: { type: "pressed-item", item },
    }, [Combobox.Plugins.toggleOnSelect()]);
    
    expect(Combobox.toSelectedItem(selected.model)).toEqual(item);
    expect(Combobox.toSelectedItem(unselected.model)).toEqual(null);
  })
});
