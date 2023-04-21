//
//
//
// Config
//
//
//

export type Config<TItem> = {
  toId: (item: TItem) => string;
  toInputValue: (item: TItem) => string;
  toFiltered: (model: Model<TItem>) => TItem[];
};

//
//
//
//
// Model
//
//
//
//

export type Model<TItem> = ModelState<TItem> & {
  allItems: TItem[];
};

type ModelState<TItem> =
  | {
      type: "unselected__blurred";
    }
  | {
      type: "unselected__focused__opened";
      inputValue: string;
    }
  | {
      type: "unselected__focused__opened__highlighted";
      inputValue: string;
      highlightIndex: number;
    }
  | {
      type: "unselected__focused__closed";
      inputValue: string;
    }
  | {
      type: "selected__blurred";
      selected: TItem;
    }
  | {
      type: "selected__focused__closed";
      inputValue: string;
      selected: TItem;
    }
  | {
      type: "selected__focused__opened";
      selected: TItem;
      inputValue: string;
    }
  | {
      type: "selected__focused__opened__highlighted";
      selected: TItem;
      inputValue: string;
      highlightIndex: number;
    };

export const init = <TItem>({
  allItems,
}: {
  allItems: TItem[];
}): Model<TItem> => {
  return {
    type: "unselected__blurred",
    allItems,
  };
};

//
//
//
//
// Update
//
//
//
//

export type Msg<TItem> =
  | {
      type: "pressed-arrow-key";
      key: "arrow-up" | "arrow-down";
    }
  | {
      type: "pressed-escape-key";
    }
  | {
      type: "pressed-enter-key";
    }
  | {
      type: "clicked-item";
      item: TItem;
    }
  | {
      type: "focused-input";
    }
  | {
      type: "blurred-input";
    }
  | {
      type: "inputted-value";
      inputValue: string;
    }
  | {
      type: "mouse-hovered-over-item";
      index: number;
    }
  | {
      type: "clicked-input";
    };

export type Effect<TItem> = {
  type: "scroll-item-into-view";
  item: TItem;
};

export const update = <TItem>(
  config: Config<TItem>,
  input: {
    model: Model<TItem>;
    msg: Msg<TItem>;
  }
): {
  model: Model<TItem>;
  effects?: Effect<TItem>[];
} => {
  const updated = updateModel(config, input);
  const effects = toScrollEffects(config, {
    ...input,
    prev: input.model,
    model: updated,
  });

  return {
    model: updated,
    effects: effects,
  };
};

const toScrollEffects = <TItem>(
  config: Config<TItem>,
  {
    prev,
    model,
    msg,
  }: {
    prev: Model<TItem>;
    model: Model<TItem>;
    msg: Msg<TItem>;
  }
): Effect<TItem>[] => {
  const effects: Effect<TItem>[] = [];

  if (
    prev.type === "selected__focused__closed" &&
    model.type === "selected__focused__opened"
  ) {
    effects.push({
      type: "scroll-item-into-view",
      item: model.selected,
    });
  }

  if (
    (model.type === "selected__focused__opened__highlighted" ||
      model.type === "unselected__focused__opened__highlighted") &&
    msg.type === "pressed-arrow-key"
  ) {
    const filtered = config.toFiltered(model);

    const highlightedItem = filtered[model.highlightIndex];

    if (highlightedItem) {
      effects.push({
        type: "scroll-item-into-view",
        item: highlightedItem,
      });
    }
  }

  return effects;
};

const updateModel = <TItem>(
  { toInputValue, toId, toFiltered }: Config<TItem>,
  {
    model,
    msg,
  }: {
    model: Model<TItem>;
    msg: Msg<TItem>;
  }
): Model<TItem> => {
  switch (model.type) {
    case "selected__blurred": {
      switch (msg.type) {
        case "focused-input": {
          return {
            ...model,
            type: "selected__focused__opened",
            inputValue: toInputValue(model.selected),
            selected: model.selected,
          };
        }
        default: {
          return model;
        }
      }
    }

    case "selected__focused__closed": {
      switch (msg.type) {
        case "clicked-input": {
          return { ...model, type: "selected__focused__opened" };
        }

        case "blurred-input": {
          return { ...model, type: "selected__blurred" };
        }

        case "inputted-value": {
          if (msg.inputValue === "") {
            return {
              ...model,
              inputValue: msg.inputValue,
              type: "unselected__focused__opened",
            };
          }
          return {
            ...model,
            inputValue: msg.inputValue,
            type: "selected__focused__opened",
          };
        }

        case "pressed-arrow-key": {
          return {
            ...model,
            inputValue: model.inputValue,
            type: "selected__focused__opened",
          };
        }

        default: {
          return model;
        }
      }
    }

    case "selected__focused__opened": {
      switch (msg.type) {
        case "mouse-hovered-over-item": {
          return {
            ...model,
            type: "selected__focused__opened__highlighted",
            highlightIndex: msg.index,
          };
        }
        case "blurred-input": {
          return {
            ...model,
            type: "selected__blurred",
            selected: model.selected,
          };
        }

        case "clicked-item": {
          return {
            ...model,
            type: "selected__focused__closed",
            inputValue: toInputValue(model.selected),
            selected: msg.item,
          };
        }

        case "inputted-value": {
          if (msg.inputValue === "") {
            return {
              ...model,
              inputValue: "",
              type: "unselected__focused__opened",
            };
          }
          return { ...model, inputValue: msg.inputValue };
        }

        case "pressed-enter-key": {
          return {
            ...model,
            inputValue: toInputValue(model.selected),
            type: "selected__focused__closed",
          };
        }

        case "pressed-arrow-key": {
          const filtered = toFiltered(model);

          const selectedIndex = filtered.findIndex(
            (item) => toId(item) === toId(model.selected)
          );

          if (selectedIndex === -1) {
            return {
              ...model,
              highlightIndex: 0,
              type: "selected__focused__opened__highlighted",
            };
          }

          const delta = msg.key === "arrow-down" ? 1 : -1;

          const highlightIndex = circularIndex(
            selectedIndex + delta,
            filtered.length
          );

          return {
            ...model,
            highlightIndex,
            type: "selected__focused__opened__highlighted",
          };
        }

        case "pressed-escape-key": {
          return {
            ...model,
            type: "selected__focused__closed",
          };
        }

        default: {
          return model;
        }
      }
    }

    case "selected__focused__opened__highlighted": {
      switch (msg.type) {
        case "mouse-hovered-over-item": {
          return { ...model, highlightIndex: msg.index };
        }

        case "blurred-input": {
          return { ...model, type: "selected__blurred" };
        }

        case "clicked-item": {
          return {
            ...model,
            type: "selected__focused__closed",
            inputValue: toInputValue(msg.item),
            selected: msg.item,
          };
        }

        case "inputted-value": {
          if (msg.inputValue === "") {
            return {
              ...model,
              inputValue: "",
              type: "unselected__focused__opened",
            };
          }
          return { ...model, inputValue: msg.inputValue };
        }

        case "pressed-arrow-key": {
          const filtered = toFiltered(model);
          const delta = msg.key === "arrow-down" ? 1 : -1;
          const highlightIndex = circularIndex(
            model.highlightIndex + delta,
            filtered.length
          );
          return { ...model, highlightIndex };
        }

        case "pressed-enter-key": {
          const filtered = toFiltered(model);

          const selectedNew = filtered[model.highlightIndex];

          if (!selectedNew) {
            return { ...model, type: "selected__focused__closed" };
          }

          return {
            ...model,
            inputValue: toInputValue(selectedNew),
            selected: selectedNew,
            type: "selected__focused__closed",
          };
        }

        case "pressed-escape-key": {
          return { ...model, type: "selected__focused__closed" };
        }

        default: {
          return model;
        }
      }
    }

    case "unselected__blurred": {
      switch (msg.type) {
        case "focused-input": {
          return {
            ...model,
            type: "unselected__focused__opened",
            inputValue: "",
          };
        }
        default: {
          return model;
        }
      }
    }

    case "unselected__focused__closed": {
      switch (msg.type) {
        case "clicked-input": {
          return { ...model, type: "unselected__focused__opened" };
        }

        case "blurred-input": {
          return { ...model, type: "unselected__blurred" };
        }
        case "inputted-value": {
          return {
            ...model,
            type: "unselected__focused__opened",
            inputValue: msg.inputValue,
          };
        }

        case "pressed-arrow-key": {
          return { ...model, type: "unselected__focused__opened" };
        }

        default: {
          return model;
        }
      }
    }

    case "unselected__focused__opened": {
      switch (msg.type) {
        case "mouse-hovered-over-item": {
          return {
            ...model,
            type: "unselected__focused__opened__highlighted",
            highlightIndex: msg.index,
          };
        }

        case "blurred-input": {
          return { ...model, type: "unselected__blurred" };
        }

        case "clicked-item": {
          return {
            ...model,
            type: "selected__focused__closed",
            selected: msg.item,
            inputValue: toInputValue(msg.item),
          };
        }

        case "inputted-value": {
          return { ...model, inputValue: msg.inputValue };
        }

        case "pressed-arrow-key": {
          const filtered = toFiltered(model);
          const highlightIndex =
            msg.key === "arrow-up" ? filtered.length - 1 : 0;

          return {
            ...model,
            type: "unselected__focused__opened__highlighted",
            highlightIndex,
          };
        }

        case "pressed-escape-key": {
          return { ...model, type: "unselected__focused__closed" };
        }

        default: {
          return model;
        }
      }
    }

    case "unselected__focused__opened__highlighted": {
      switch (msg.type) {
        case "mouse-hovered-over-item": {
          return { ...model, highlightIndex: msg.index };
        }

        case "blurred-input": {
          return { ...model, type: "unselected__blurred" };
        }

        case "clicked-item": {
          return {
            ...model,
            type: "selected__focused__closed",
            selected: msg.item,
            inputValue: toInputValue(msg.item),
          };
        }

        case "inputted-value": {
          return {
            ...model,
            type: "unselected__focused__opened",
            inputValue: msg.inputValue,
          };
        }

        case "pressed-arrow-key": {
          const filtered = toFiltered(model);
          const delta = msg.key === "arrow-down" ? 1 : -1;
          const highlightIndex = circularIndex(
            model.highlightIndex + delta,
            filtered.length
          );
          return {
            ...model,
            highlightIndex,
          };
        }

        case "pressed-enter-key": {
          const filtered = toFiltered(model);

          const selectedNew = filtered[model.highlightIndex];

          if (!selectedNew) {
            return { ...model, type: "unselected__focused__closed" };
          }

          return {
            ...model,
            inputValue: toInputValue(selectedNew),
            selected: selectedNew,
            type: "selected__focused__closed",
          };
        }

        case "pressed-escape-key": {
          return {
            ...model,
            type: "unselected__focused__closed",
          };
        }
        default: {
          return model;
        }
      }
    }

    default: {
      const exhaustive: never = model;
      return exhaustive;
    }
  }
};

const circularIndex = (index: number, length: number) => {
  if (length === 0) {
    return 0;
  }
  return ((index % length) + length) % length;
};

//
//
//
//
// Selectors
//
//
//
//

export const isItemSelected = <TItem>(
  { toId }: Pick<Config<TItem>, "toId">,
  model: Model<TItem>,
  item: TItem
) => {
  switch (model.type) {
    case "selected__blurred":
    case "selected__focused__opened":
    case "selected__focused__closed":
    case "selected__focused__opened__highlighted": {
      return toId(model.selected) === toId(item);
    }

    case "unselected__blurred":
    case "unselected__focused__closed":
    case "unselected__focused__opened":
    case "unselected__focused__opened__highlighted": {
      return false;
    }
  }
};

export const isIndexHighlighted = <TItem>(
  model: Model<TItem>,
  index: number
): boolean => {
  switch (model.type) {
    case "unselected__blurred":
    case "unselected__focused__closed":
    case "unselected__focused__opened":
    case "selected__blurred":
    case "selected__focused__opened":
    case "selected__focused__closed": {
      return false;
    }

    case "unselected__focused__opened__highlighted":
    case "selected__focused__opened__highlighted": {
      return model.highlightIndex === index;
    }
  }
};

export const isOpened = <TItem>(model: Model<TItem>): boolean => {
  return (
    model.type === "selected__focused__opened" ||
    model.type === "selected__focused__opened__highlighted" ||
    model.type === "unselected__focused__opened" ||
    model.type === "unselected__focused__opened__highlighted"
  );
};

export const toInputValue = <TItem>(
  { toInputValue }: Pick<Config<TItem>, "toInputValue">,
  model: Model<TItem>
) => {
  switch (model.type) {
    case "unselected__blurred": {
      return "";
    }

    case "selected__blurred": {
      return toInputValue(model.selected);
    }

    case "selected__focused__closed":
    case "selected__focused__opened":
    case "selected__focused__opened__highlighted":
    case "unselected__focused__closed":
    case "unselected__focused__opened":
    case "unselected__focused__opened__highlighted": {
      return model.inputValue;
    }
  }
};

export const toHighlightedItem = <TItem>(
  { toFiltered }: Config<TItem>,
  model: Model<TItem>
): TItem | null => {
  switch (model.type) {
    case "unselected__blurred":
    case "unselected__focused__closed":
    case "unselected__focused__opened":
    case "selected__blurred":
    case "selected__focused__opened":
    case "selected__focused__closed": {
      return null;
    }

    case "unselected__focused__opened__highlighted":
    case "selected__focused__opened__highlighted": {
      const item = toFiltered(model)[model.highlightIndex];

      return item ?? null;
    }
  }
};

//
//
//
//
// Debug
//
//
//
//

export const consoleLog = <TItem>({
  input,
  output,
}: {
  input: {
    model: Model<TItem>;
    msg: Msg<TItem>;
  };
  output: {
    model: Model<TItem>;
    effects?: Effect<TItem>[];
  };
}) => {
  console.log("\n");
  console.log("PREV ", input.model.type);
  console.log("msg: ", input.msg.type);
  console.log("NEXT ", output.model.type);
  console.log("effects: ", output.effects?.map((eff) => eff.type).join(", "));
  console.log("\n");
};
