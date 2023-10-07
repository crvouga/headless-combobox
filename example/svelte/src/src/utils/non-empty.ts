export type NonEmpty<T> = [T, ...T[]];

export const isNonEmpty = <T>(arr: T[]): arr is NonEmpty<T> => {
  return arr.length > 0;
};
