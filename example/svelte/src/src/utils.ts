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
