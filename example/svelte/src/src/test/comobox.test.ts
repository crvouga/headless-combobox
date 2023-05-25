import * as Combobox from "../combobox";
import { top100Films } from "./test-data";

const test = (description: string, fn: Function) => {
  try {
    fn();
    console.log("✅", description);
  } catch (error) {
    console.log("❌", error);
  }
};

test("combobox", () => {
  const _model = Combobox.init({
    allItems: top100Films,
    inputMode: {
      type: "select-only",
    },
  });
  throw new Error("bas");
});
