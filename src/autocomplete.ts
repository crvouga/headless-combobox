export type Model<TItem> = State<TItem> & {
  allItems: TItem[];
};

type State<TItem> =
  | {
      type: "unselected & blurred";
    }
  | {
      type: "unselected & focused & opened";
      query: string;
    }
  | {
      type: "unselected & focused & opened & highlighted";
      query: string;
      highlightIndex: number;
    }
  | {
      type: "unselected & focused & closed";
      query: string;
    }
  | {
      type: "selected & blurred";
      selected: TItem;
    }
  | {
      type: "selected & focused & closed";
      query: string;
      selected: TItem;
    }
  | {
      type: "selected & focused & opened";
      selected: TItem;
      query: string;
    }
  | {
      type: "selected & focused & opened & highlighted";
      selected: TItem;
      query: string;
      highlightIndex: number;
    };

export type Event<TItem> =
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
    };

export const reducer = <TItem>({
  toQuery,
  toKey,
  toFiltered,
  model,
  event,
}: {
  toKey: (item: TItem) => string;
  toQuery: (item: TItem) => string;
  toFiltered: (model: Model<TItem> & { query: string }) => TItem[];
  model: Model<TItem>;
  event: Event<TItem>;
}): Model<TItem> => {
  switch (model.type) {
    case "selected & blurred": {
      switch (event.type) {
        case "focused-input": {
          return {
            ...model,
            type: "selected & focused & opened",
            query: toQuery(model.selected),
            selected: model.selected,
          };
        }
        default: {
          return model;
        }
      }
    }

    case "selected & focused & closed": {
      switch (event.type) {
        case "blurred-input": {
          return { ...model, type: "selected & blurred" };
        }

        case "inputted-query": {
          return { ...model, type: "selected & focused & opened" };
        }

        case "pressed-arrow-key": {
          return { ...model, type: "selected & focused & opened" };
        }

        default: {
          return model;
        }
      }
    }

    case "selected & focused & opened": {
      switch (event.type) {
        case "blurred-input": {
          return {
            ...model,
            type: "selected & blurred",
            selected: model.selected,
          };
        }

        case "clicked-item": {
          return {
            ...model,
            type: "selected & focused & closed",
            query: model.query,
            selected: event.item,
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
              type: "selected & focused & opened & highlighted",
            };
          }

          const delta = event.key === "arrow-down" ? 1 : -1;

          const highlightIndex = circularIndex(
            selectedIndex + delta,
            filtered.length
          );

          return {
            ...model,
            highlightIndex,
            type: "selected & focused & opened & highlighted",
          };
        }

        case "pressed-escape-key": {
          return { ...model, type: "selected & focused & closed" };
        }

        default: {
          return model;
        }
      }
    }

    case "selected & focused & opened & highlighted": {
      switch (event.type) {
        case "blurred-input": {
          return { ...model, type: "selected & blurred" };
        }

        case "clicked-item": {
          return {
            ...model,
            type: "selected & focused & closed",
            selected: event.item,
          };
        }

        case "inputted-query": {
          return { ...model, query: event.query };
        }

        case "pressed-arrow-key": {
          const filtered = toFiltered(model);
          const delta = event.key === "arrow-down" ? 1 : -1;
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
            return { ...model, type: "selected & focused & closed" };
          }

          return {
            ...model,
            selected: selectedNew,
            type: "selected & focused & closed",
          };
        }

        case "pressed-escape-key": {
          return { ...model, type: "selected & focused & closed" };
        }

        default: {
          return model;
        }
      }
    }

    case "unselected & blurred": {
      switch (event.type) {
        case "focused-input": {
          return { ...model, type: "unselected & focused & opened", query: "" };
        }
        default: {
          return model;
        }
      }
    }

    case "unselected & focused & closed": {
      switch (event.type) {
        case "blurred-input": {
          return { ...model, type: "unselected & blurred" };
        }
        case "inputted-query": {
          return {
            ...model,
            type: "unselected & focused & opened",
            query: event.query,
          };
        }

        case "pressed-arrow-key": {
          return { ...model, type: "unselected & focused & opened" };
        }

        default: {
          return model;
        }
      }
    }

    case "unselected & focused & opened": {
      switch (event.type) {
        case "blurred-input": {
          return { ...model, type: "unselected & blurred" };
        }

        case "clicked-item": {
          return {
            ...model,
            type: "selected & focused & closed",
            selected: event.item,
          };
        }

        case "inputted-query": {
          return { ...model, query: event.query };
        }

        case "pressed-arrow-key": {
          const filtered = toFiltered(model);
          const highlightIndex =
            event.key === "arrow-up" ? filtered.length - 1 : 0;

          return {
            ...model,
            type: "unselected & focused & opened & highlighted",
            highlightIndex,
          };
        }

        case "pressed-escape-key": {
          return { ...model, type: "unselected & focused & closed" };
        }

        default: {
          return model;
        }
      }
    }

    case "unselected & focused & opened & highlighted": {
      switch (event.type) {
        case "blurred-input": {
          return { ...model, type: "unselected & blurred" };
        }

        case "clicked-item": {
          return {
            ...model,
            type: "selected & focused & closed",
            selected: event.item,
          };
        }

        case "inputted-query": {
          return {
            ...model,
            type: "unselected & focused & opened",
            query: event.query,
          };
        }

        case "pressed-arrow-key": {
          const filtered = toFiltered(model);
          const delta = event.key === "arrow-down" ? 1 : -1;
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
            return { ...model, type: "unselected & focused & closed" };
          }

          return {
            ...model,
            selected: selectedNew,
            type: "selected & focused & closed",
          };
        }

        case "pressed-escape-key": {
          return {
            ...model,
            type: "unselected & focused & closed",
          };
        }
      }
      return model;
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

export const isHighlighted = <TItem>(
  model: Model<TItem>,
  index: number
): boolean => {
  return (
    (model.type === "selected & focused & opened & highlighted" &&
      model.highlightIndex === index) ||
    (model.type === "unselected & focused & opened & highlighted" &&
      model.highlightIndex === index)
  );
};

export const isOpened = <TItem>(model: Model<TItem>): boolean => {
  return (
    model.type === "selected & focused & opened" ||
    model.type === "selected & focused & opened & highlighted" ||
    model.type === "unselected & focused & opened" ||
    model.type === "unselected & focused & opened & highlighted"
  );
};

export const toQuery = <TItem>(
  toQuery: (item: TItem) => string,
  model: Model<TItem>
) => {
  switch (model.type) {
    case "selected & blurred": {
      return toQuery(model.selected);
    }

    case "selected & focused & closed": {
      return toQuery(model.selected);
    }

    case "selected & focused & opened": {
      return model.query;
    }

    case "selected & focused & opened & highlighted": {
      return model.query;
    }

    case "unselected & blurred": {
      return "";
    }

    case "unselected & focused & closed": {
      return model.query;
    }

    case "unselected & focused & opened": {
      return model.query;
    }

    case "unselected & focused & opened & highlighted": {
      return model.query;
    }
  }
};
