export type ItemStore<T> = {
  insert: (input: { items: T[] }) => Promise<void>;
  getById: (input: { id: string }) => Promise<T | null | undefined>;
  getIndex: (input: { id: string }) => Promise<number | null | undefined>;
  search: (input: {
    searchQuery: string;
    pageSize: number;
    page: number;
  }) => Promise<{
    items: T[];
    total: number;
    pageIndex: number;
    pageSize: number;
  }>;
};
