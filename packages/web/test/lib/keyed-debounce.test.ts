import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { KeyedDebounce } from '@/lib/keyed-debounce';

describe('KeyedDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isEmpty', () => {
    it('is true only while no call waits', () => {
      const debounce = new KeyedDebounce({ wait: 1000, maxWait: 5000 });
      expect(debounce.isEmpty()).toBe(true);

      debounce.schedule({ key: 'step_1', run: () => undefined });
      expect(debounce.isEmpty()).toBe(false);

      vi.advanceTimersByTime(1000);
      expect(debounce.isEmpty()).toBe(true);
    });
  });

  describe('flush', () => {
    it('sends the pending call of every key at once', () => {
      const debounce = new KeyedDebounce({ wait: 1000, maxWait: 5000 });
      const sent: string[] = [];

      debounce.schedule({ key: 'step_1', run: () => sent.push('step_1 edit') });
      debounce.schedule({ key: 'note_1', run: () => sent.push('note_1 edit') });
      debounce.flush();
      expect(sent).toEqual(['step_1 edit', 'note_1 edit']);

      vi.advanceTimersByTime(5000);
      expect(sent).toEqual(['step_1 edit', 'note_1 edit']);
    });

    it('starts a new wait for a call after the flush', () => {
      const debounce = new KeyedDebounce({ wait: 1000, maxWait: 5000 });
      const sent: string[] = [];

      debounce.schedule({ key: 'step_1', run: () => sent.push('Ord') });
      vi.advanceTimersByTime(500);
      debounce.flush();
      debounce.schedule({ key: 'step_1', run: () => sent.push('Order') });
      vi.advanceTimersByTime(999);
      expect(sent).toEqual(['Ord']);

      vi.advanceTimersByTime(1);
      expect(sent).toEqual(['Ord', 'Order']);
    });
  });

  describe('whenEmpty', () => {
    it('settles at once when no call waits', async () => {
      const debounce = new KeyedDebounce({ wait: 1000, maxWait: 5000 });

      await expect(debounce.whenEmpty()).resolves.toBeUndefined();
    });

    it('settles after the last pending call runs', async () => {
      const debounce = new KeyedDebounce({ wait: 1000, maxWait: 5000 });
      const events: string[] = [];

      debounce.schedule({
        key: 'step_1',
        run: () => events.push('step_1 edit'),
      });
      vi.advanceTimersByTime(500);
      debounce.schedule({
        key: 'note_1',
        run: () => events.push('note_1 edit'),
      });
      debounce
        .whenEmpty()
        .then(() => events.push('empty'))
        .catch(() => undefined);
      await vi.advanceTimersByTimeAsync(500);
      expect(events).toEqual(['step_1 edit']);

      await vi.advanceTimersByTimeAsync(500);
      expect(events).toEqual(['step_1 edit', 'note_1 edit', 'empty']);
    });
  });

  it('sends only the latest call of a key, after the wait', () => {
    const debounce = new KeyedDebounce({ wait: 1000, maxWait: 5000 });
    const sent: string[] = [];

    debounce.schedule({ key: 'step_1', run: () => sent.push('Ord') });
    vi.advanceTimersByTime(500);
    debounce.schedule({ key: 'step_1', run: () => sent.push('Order') });
    vi.advanceTimersByTime(999);
    expect(sent).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(sent).toEqual(['Order']);
  });

  it('keeps one timer for each key', () => {
    const debounce = new KeyedDebounce({ wait: 1000, maxWait: 5000 });
    const sent: string[] = [];

    debounce.schedule({ key: 'step_1', run: () => sent.push('step_1 first') });
    vi.advanceTimersByTime(500);
    debounce.schedule({ key: 'note_1', run: () => sent.push('note_1 edit') });
    vi.advanceTimersByTime(400);
    debounce.schedule({ key: 'step_1', run: () => sent.push('step_1 second') });
    vi.advanceTimersByTime(600);
    expect(sent).toEqual(['note_1 edit']);

    vi.advanceTimersByTime(400);
    expect(sent).toEqual(['note_1 edit', 'step_1 second']);
  });

  it('sends a continuous burst of calls at least every 5 s', () => {
    const debounce = new KeyedDebounce({ wait: 1000, maxWait: 5000 });
    const sent: number[] = [];

    for (let elapsed = 0; elapsed < 12_000; elapsed += 200) {
      debounce.schedule({ key: 'step_1', run: () => sent.push(elapsed) });
      vi.advanceTimersByTime(200);
    }
    expect(sent).toEqual([4800, 9800]);

    vi.advanceTimersByTime(800);
    expect(sent).toEqual([4800, 9800, 11_800]);
  });
});
