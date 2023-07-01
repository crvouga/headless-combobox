import type { ItemStore as ItemStore } from "./item-store";

export const initItemStore = <T>(): ItemStore<T> => {
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
