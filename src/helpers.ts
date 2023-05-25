export const removeFirst = <T>(predicate: (x: T) => boolean, arr: T[]): T[] => {
  const index = arr.findIndex(predicate);
  if (index === -1) return arr;
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
};

export const isSingleton = <T>(arr: T[]): arr is [T] => {
  return arr.length === 1;
};
