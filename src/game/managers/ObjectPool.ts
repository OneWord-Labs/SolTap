export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (item: T) => void;
  private maxSize: number;

  constructor(
    createFn: () => T,
    resetFn: (item: T) => void,
    initialSize: number = 10,
    maxSize: number = 50
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    
    // Initialize pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    
    if (this.pool.length < this.maxSize) {
      return this.createFn();
    }
    
    throw new Error('Object pool exhausted');
  }

  release(item: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(item);
      this.pool.push(item);
    }
  }

  clear(): void {
    this.pool = [];
  }
}
