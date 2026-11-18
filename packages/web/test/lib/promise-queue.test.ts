import { describe, expect, it } from 'vitest';

import { PromiseQueue } from '@/lib/promise-queue';

describe('PromiseQueue', () => {
  it('runs the next task after a task fails', async () => {
    const queue = new PromiseQueue();
    const ran: string[] = [];

    queue.add(async () => {
      throw new Error('save failed');
    });
    queue.add(async () => {
      ran.push('next save');
    });
    await flushPromises();

    expect(ran).toEqual(['next save']);
  });

  describe('drain', () => {
    it('settles at once on an empty queue', async () => {
      const queue = new PromiseQueue();

      await expect(queue.drain()).resolves.toBeUndefined();
    });

    it('settles after the save in flight and the queued saves', async () => {
      const queue = new PromiseQueue();
      const saveInFlight = controlledSave();
      const queuedSave = controlledSave();
      queue.add(saveInFlight.run);
      queue.add(queuedSave.run);
      await flushPromises();

      const drained = trackSettled(queue.drain());
      saveInFlight.finish();
      await flushPromises();
      expect(drained.settled).toBe(false);

      queuedSave.finish();
      await flushPromises();
      expect(drained.settled).toBe(true);
    });

    it('rejects when a save in the queue fails', async () => {
      const queue = new PromiseQueue();
      queue.add(async () => {
        throw new Error('save failed');
      });
      queue.add(async () => undefined);

      await expect(queue.drain()).rejects.toThrow('save failed');
    });

    it('rejects only after the saves behind a failed save settle', async () => {
      const queue = new PromiseQueue();
      queue.add(async () => {
        throw new Error('save failed');
      });
      const queuedSave = controlledSave();
      queue.add(queuedSave.run);

      const drained = trackSettled(queue.drain());
      await flushPromises();
      expect(drained.settled).toBe(false);

      queuedSave.finish();
      await flushPromises();
      expect(drained.settled).toBe(true);
    });

    it('settles only after a save added during the drain', async () => {
      const queue = new PromiseQueue();
      const firstSave = controlledSave();
      const laterSave = controlledSave();
      queue.add(firstSave.run);

      const drained = trackSettled(queue.drain());
      queue.add(laterSave.run);
      firstSave.finish();
      await flushPromises();
      expect(drained.settled).toBe(false);

      laterSave.finish();
      await flushPromises();
      expect(drained.settled).toBe(true);
    });

    it('rejects when a save added during the drain fails', async () => {
      const queue = new PromiseQueue();
      const firstSave = controlledSave();
      queue.add(firstSave.run);

      const drained = queue.drain();
      queue.add(async () => {
        throw new Error('later save failed');
      });
      firstSave.finish();

      await expect(drained).rejects.toThrow('later save failed');
    });

    it('ignores a failed save that settled before the drain', async () => {
      const queue = new PromiseQueue();
      queue.add(async () => {
        throw new Error('save failed');
      });
      await flushPromises();

      await expect(queue.drain()).resolves.toBeUndefined();
    });
  });
});

function controlledSave() {
  let finish: () => void = () => undefined;
  const done = new Promise<void>((resolve) => {
    finish = resolve;
  });
  return {
    run: () => done,
    finish: () => finish(),
  };
}

function trackSettled(promise: Promise<unknown>) {
  const tracker = { settled: false };
  promise.then(
    () => {
      tracker.settled = true;
    },
    () => {
      tracker.settled = true;
    },
  );
  return tracker;
}

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
