import type { ItemStore as ItemStore } from "./item-store";

export const initItemStore = <T>({
  toItemId,
}: {
  toItemId: (item: T) => string | number;
}): ItemStore<T> => {
  const itemsById = new Map<string | number, T>();
  const indexById = new Map<string | number, number>();
  const idByIndex = new Map<string | number, number>();
  return {
    async insert(input) {
      for (const item of input.items) {
        itemsById.set(toItemId(item), item);
      }
      return;
    },

    async getById(input) {
      return undefined;
    },

    async getIndex(input) {
      return 0;
    },

    async search(input) {
      return {
        items: [],
        total: 0,
        pageIndex: 0,
        pageSize: 0,
      };
    },
  };
};
