export const removeFirst = <T>(predicate: (x: T) => boolean, arr: T[]): T[] => {
  const index = arr.findIndex(predicate);
  if (index === -1) return arr;
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
};

export const circularIndex = (index: number, length: number) => {
  if (length === 0) {
    return 0;
  }
  return ((index % length) + length) % length;
};

export const clampIndex = (index: number, length: number) => {
  if (length === 0) {
    return 0;
  }
  return Math.min(Math.max(0, index), length - 1);
};

export const uniqueBy = <TItem>(
  items: TItem[],
  toKey: (item: TItem) => string | number
): TItem[] => {
  const seen = new Set<string | number>();
  const result: TItem[] = [];
  for (const item of items) {
    const key = toKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
};

export const intersect = <T>(
  toKey: (x: T) => string | number,
  a: T[],
  b: T[]
): T[] => {
  const bKeys = new Set<string | number>();

  for (let i = 0; i < b.length; i++) {
    const bi = b[i];
    if (bi) {
      bKeys.add(toKey(bi));
    }
  }

  const output: T[] = [];

  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    if (ai && bKeys.has(toKey(ai))) {
      output.push(ai);
    }
  }

  return output;
};
