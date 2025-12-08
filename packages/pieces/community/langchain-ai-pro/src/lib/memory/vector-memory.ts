export class VectorMemory {
  private store: Record<string, string[]> = {};

  addMemory(agent: string, text: string) {
    if (!this.store[agent]) {
      this.store[agent] = [];
    }
    this.store[agent].push(text);
  }

  dump() {
    return this.store;
  }
}
