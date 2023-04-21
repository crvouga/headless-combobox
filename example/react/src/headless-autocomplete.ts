//
//
//
// Model
//
//
//

export type Model<TItem> = State<TItem> & {
  allItems: TItem[];
};

type State<TItem> =
  | {
      type: "unselected__blurred";
    }
  | {
      type: "unselected__focused__opened";
      query: string;
    }
  | {
      type: "unselected__focused__opened__highlighted";
      query: string;
      highlightIndex: number;
    }
  | {
      type: "unselected__focused__closed";
      query: string;
    }
  | {
      type: "selected__blurred";
      selected: TItem;
    }
  | {
      type: "selected__focused__closed";
      query: string;
      selected: TItem;
    }
  | {
      type: "selected__focused__opened";
      selected: TItem;
      query: string;
    }
  | {
      type: "selected__focused__opened__highlighted";
      selected: TItem;
      query: string;
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
// Update
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
      type: "inputted-query";
      query: string;
    }
  | {
      type: "mouse-hovered-over-item";
      index: number;
    }
  | {
      type: "clicked-input";
    };

export type Effect<TItem> = {
  type: "scroll-highlighted-item-into-view";
  highlightedItem: TItem;
};

export type Config<TItem> = {
  toKey: (item: TItem) => string;
  toQuery: (item: TItem) => string;
  toFiltered: (model: Model<TItem>) => TItem[];
};

export type UpdateInput<TItem> = {
  model: Model<TItem>;
  msg: Msg<TItem>;
};

export type UpdateOutput<TItem> = {
  model: Model<TItem>;
  effects?: Effect<TItem>[];
};

export const update = <TItem>(
  config: Config<TItem>,
  input: UpdateInput<TItem>
): UpdateOutput<TItem> => {
  const updated = updateModel(config, input);
  const effects = toScrollEffects(config, {
    ...input,
    model: updated,
  });

  return {
    model: updated,
    effects: effects,
  };
};

const toScrollEffects = <TItem>(
  config: Config<TItem>,
  input: UpdateInput<TItem>
): Effect<TItem>[] => {
  switch (input.model.type) {
    case "selected__focused__opened__highlighted":
    case "unselected__focused__opened__highlighted": {
      if (input.msg.type === "pressed-arrow-key") {
        const filtered = config.toFiltered(input.model);

        const highlightedItem = filtered[input.model.highlightIndex];

        if (highlightedItem) {
          return [
            {
              type: "scroll-highlighted-item-into-view",
              highlightedItem,
            },
          ];
        }
      }

      return [];
    }

    default: {
      return [];
    }
  }
};

const updateModel = <TItem>(
  { toQuery, toKey, toFiltered }: Config<TItem>,
  { model, msg }: UpdateInput<TItem>
): Model<TItem> => {
  switch (model.type) {
    case "selected__blurred": {
      switch (msg.type) {
        case "focused-input": {
          return {
            ...model,
            type: "selected__focused__opened",
            query: toQuery(model.selected),
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

        case "inputted-query": {
          if (msg.query === "") {
            return {
              ...model,
              query: msg.query,
              type: "unselected__focused__opened",
            };
          }
          return {
            ...model,
            query: msg.query,
            type: "selected__focused__opened",
          };
        }

        case "pressed-arrow-key": {
          return {
            ...model,
            query: model.query,
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
            query: toQuery(model.selected),
            selected: msg.item,
          };
        }

        case "inputted-query": {
          if (msg.query === "") {
            return {
              ...model,
              query: "",
              type: "unselected__focused__opened",
            };
          }
          return { ...model, query: msg.query };
        }

        case "pressed-enter-key": {
          return {
            ...model,
            query: toQuery(model.selected),
            type: "selected__focused__closed",
          };
        }

        case "pressed-arrow-key": {
          const filtered = toFiltered(model);

          const selectedIndex = filtered.findIndex(
            (item) => toKey(item) === toKey(item)
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
            query: toQuery(msg.item),
            selected: msg.item,
          };
        }

        case "inputted-query": {
          if (msg.query === "") {
            return {
              ...model,
              query: "",
              type: "unselected__focused__opened",
            };
          }
          return { ...model, query: msg.query };
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
            query: toQuery(selectedNew),
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
          return { ...model, type: "unselected__focused__opened", query: "" };
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
        case "inputted-query": {
          return {
            ...model,
            type: "unselected__focused__opened",
            query: msg.query,
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
            query: toQuery(msg.item),
          };
        }

        case "inputted-query": {
          return { ...model, query: msg.query };
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
            query: toQuery(msg.item),
          };
        }

        case "inputted-query": {
          return {
            ...model,
            type: "unselected__focused__opened",
            query: msg.query,
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
            query: toQuery(selectedNew),
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
// Selectors
//
//
//

export const isItemSelected = <TItem>(
  model: Model<TItem>,
  toKey: (key: TItem) => string,
  item: TItem
) => {
  switch (model.type) {
    case "selected__blurred":
    case "selected__focused__opened":
    case "selected__focused__closed":
    case "selected__focused__opened__highlighted": {
      return toKey(model.selected) === toKey(item);
    }

    case "unselected__blurred":
    case "unselected__focused__closed":
    case "unselected__focused__opened":
    case "unselected__focused__opened__highlighted": {
      return false;
    }
  }
};

export const isHighlighted = <TItem>(
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

export const toQuery = <TItem>(
  toQuery: (item: TItem) => string,
  model: Model<TItem>
) => {
  switch (model.type) {
    case "unselected__blurred": {
      return "";
    }

    case "selected__blurred": {
      return toQuery(model.selected);
    }

    case "selected__focused__closed":
    case "selected__focused__opened":
    case "selected__focused__opened__highlighted":
    case "unselected__focused__closed":
    case "unselected__focused__opened":
    case "unselected__focused__opened__highlighted": {
      return model.query;
    }
  }
};

export const toHighlightedItem = <TItem>(
  toFiltered: (model: Model<TItem>) => TItem[],
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
//
//

export const consoleLog = <TItem>({
  input,
  output,
}: {
  input: UpdateInput<TItem>;
  output: UpdateOutput<TItem>;
}) => {
  console.log("\n");
  console.log(input.model.type);
  console.log(input.msg.type);
  console.log(output.model.type);
  console.log(output.effects?.map((eff) => eff.type).join(", "));
  console.log("\n");
};
