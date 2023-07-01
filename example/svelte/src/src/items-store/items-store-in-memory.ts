import type { ItemsStore } from "./items-store";

export const initItemsStore = <T>(): ItemsStore<T> => {
  const itemsById = new Map<string, T>();
  const indexById = new Map<string, number>();
  const idByIndex = new Map<string, number>();
  return {
    getById: async (id: string) => {
      return undefined;
    },

    getIndex: async (id: string) => {
      return 0;
    },

    search: function* (searchQuery: string) {
      yield undefined as unknown as T;
    },
  };
};
