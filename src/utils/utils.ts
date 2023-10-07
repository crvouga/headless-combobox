import { LRUCache } from "./lru-cache";

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

//
//
//
//
//

export const uniqueBy = <T>(
  toKey: (item: T) => string | number,
  items: T[]
): T[] => {
  return Array.from(yieldUnique(toKey, items));
};

export const yieldUnique = function* <T>(
  toKey: (item: T) => string | number,
  items: Iterable<T>
): Generator<T> {
  const seen = new Set<string | number>();

  for (const item of items) {
    const key = toKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      yield item;
    }
  }
};

/**
 * @description
 * Set intersection, but preserves the order of the left array.
 */
export const intersectionLeft = <T>(
  toKey: (x: T) => string | number,
  a: Iterable<T>,
  b: Iterable<T>
): T[] => {
  return Array.from(yieldIntersectionLeft(toKey, a, b));
};

/**
 * @description
 * Set intersection, but preserves the order of the left array.
 */
export const yieldIntersectionLeft = function* <T>(
  toKey: (x: T) => string | number,
  a: Iterable<T>,
  b: Iterable<T>
): Generator<T> {
  const bKeys = new Set<string | number>();

  for (const bi of b) {
    bKeys.add(toKey(bi));
  }

  for (const ai of a) {
    if (bKeys.has(toKey(ai))) {
      yield ai;
    }
  }
};

export const reverse = <T>(xs: T[]): T[] => {
  const reversed: T[] = [];

  for (let i = xs.length - 1; i >= 0; i--) {
    const x = xs[i];
    if (x) {
      reversed.push(x);
    }
  }

  return reversed;
};

export const yieldReverse = function* <T>(xs: T[]): Generator<T> {
  for (let i = xs.length - 1; i >= 0; i--) {
    const x = xs[i];
    if (x) {
      yield x;
    }
  }
};

export const findIndex = <T>(
  predicate: (x: T) => boolean,
  xs: Iterable<T>
): number | null => {
  let i = 0;
  for (const x of xs) {
    if (predicate(x)) {
      return i;
    }
    i++;
  }
  return null;
};

//
//
//
//
//
//

export const keepIf = function* <T>(
  predicate: (x: T, index: number) => boolean,
  xs: Iterable<T>
): Generator<T> {
  let index = 0;
  for (const x of xs) {
    if (predicate(x, index)) {
      yield x;
    }
    index++;
  }
};

//
//
//
//
//
//
//
export const memoize = <X, Y>(
  cache: Map<string, Y>,
  keyFn: (x: X) => string,
  fn: (x: X) => Y
): ((x: X) => Y) => {
  return (x: X) => {
    const key = keyFn(x);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const y = fn(x);
    cache.set(key, y);
    return y;
  };
};
