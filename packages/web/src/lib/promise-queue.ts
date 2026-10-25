import { Mutex } from 'async-mutex';

export class PromiseQueue {
  private lock: Mutex = new Mutex();
  private waiting = 0;
  private unsettled = new Set<Promise<void>>();

  add(task: () => Promise<unknown>) {
    this.waiting++;
    const completion = this.lock.runExclusive(async () => {
      this.waiting--;
      await task();
    });
    this.unsettled.add(completion);
    const forget = () => {
      this.unsettled.delete(completion);
    };
    completion.then(forget, forget);
  }

  size() {
    return this.waiting;
  }

  isIdle() {
    return this.unsettled.size === 0;
  }

  async drain(): Promise<void> {
    const failure = await this.firstFailureUntilIdle();
    if (failure) {
      throw failure.reason;
    }
  }

  private async firstFailureUntilIdle(): Promise<
    PromiseRejectedResult | undefined
  > {
    const results = await Promise.allSettled([...this.unsettled]);
    const failure = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    if (this.unsettled.size === 0) {
      return failure;
    }
    const laterFailure = await this.firstFailureUntilIdle();
    return failure ?? laterFailure;
  }
}
