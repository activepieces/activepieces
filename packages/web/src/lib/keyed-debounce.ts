import { isNil } from '@activepieces/core-utils';

export class KeyedDebounce {
  private readonly pending = new Map<string, PendingCall>();
  private emptyWaiters: Array<() => void> = [];
  private readonly wait: number;
  private readonly maxWait: number;

  constructor({ wait, maxWait }: { wait: number; maxWait: number }) {
    this.wait = wait;
    this.maxWait = maxWait;
  }

  schedule({ key, run }: { key: string; run: () => void }) {
    const now = Date.now();
    const previous = this.pending.get(key);
    clearTimeout(previous?.timer);
    const deadline = previous?.deadline ?? now + this.maxWait;
    const timer = setTimeout(
      () => this.fire(key),
      Math.min(this.wait, deadline - now),
    );
    this.pending.set(key, { run, deadline, timer });
  }

  flush() {
    [...this.pending.keys()].forEach((key) => this.fire(key));
  }

  isEmpty() {
    return this.pending.size === 0;
  }

  whenEmpty(): Promise<void> {
    if (this.isEmpty()) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.emptyWaiters = [...this.emptyWaiters, resolve];
    });
  }

  private fire(key: string) {
    const call = this.pending.get(key);
    if (isNil(call)) {
      return;
    }
    clearTimeout(call.timer);
    this.pending.delete(key);
    call.run();
    if (this.isEmpty()) {
      const waiters = this.emptyWaiters;
      this.emptyWaiters = [];
      waiters.forEach((resolve) => resolve());
    }
  }
}

type PendingCall = {
  run: () => void;
  deadline: number;
  timer: ReturnType<typeof setTimeout>;
};
