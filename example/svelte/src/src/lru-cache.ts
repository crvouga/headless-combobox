export class LRUCache<K, V> extends Map<K, V> {
  private capacity: number;
  private order: K[];

  constructor(capacity: number) {
    super();
    this.capacity = capacity;
    this.order = [];
  }

  public get(key: K): V | undefined {
    if (super.has(key)) {
      this.updateOrder(key);
      return super.get(key);
    }
    return undefined;
  }

  public set(key: K, value: V): this {
    if (super.has(key)) {
      this.updateOrder(key);
    } else {
      if (this.order.length === this.capacity) {
        const evictedKey = this.order.shift();
        if (evictedKey) {
          super.delete(evictedKey);
        }
      }
      this.order.push(key);
    }
    return super.set(key, value);
  }

  private updateOrder(key: K): void {
    const index = this.order.indexOf(key);
    if (index !== -1) {
      this.order.splice(index, 1);
      this.order.push(key);
    }
  }
}
