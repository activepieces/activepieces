import { isNil } from '@activepieces/core-utils';

export class KeyedDebounce {
  private readonly pending = new Map<string, PendingCall>();
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

  private fire(key: string) {
    const call = this.pending.get(key);
    if (isNil(call)) {
      return;
    }
    clearTimeout(call.timer);
    this.pending.delete(key);
    call.run();
  }
}

type PendingCall = {
  run: () => void;
  deadline: number;
  timer: ReturnType<typeof setTimeout>;
};
