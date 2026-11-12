import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { todoistFake } from './todoist-fake';

const { vendor, trigger, complete, memoryStore, ctx, ids } = todoistFake;

const CURSOR = Date.UTC(2026, 9, 1, 12, 0, 0);
const NOW = Date.UTC(2026, 9, 1, 12, 30, 0);

async function pollOnEngineInTimeZone({ tz }: { tz: string }) {
  process.env.TZ = tz;
  vendor.requests.length = 0;
  const emitted = await trigger.run(ctx({ store: memoryStore({ lastPoll: CURSOR }) }));
  return { emitted: ids(emitted), window: vendor.requests[0] };
}

describe('Todoist Task Completed poll window vs engine time zone', () => {
  beforeEach(() => {
    todoistFake.reset({ at: NOW });
    complete({ id: 'task-1', at: Date.UTC(2026, 9, 1, 12, 10, 0), visibleFrom: 0 });
  });

  afterEach(() => {
    todoistFake.restore();
  });

  it('emits the same completed tasks and sends the same window on UTC, UTC+9 and UTC-4 engines', async () => {
    const utc = await pollOnEngineInTimeZone({ tz: 'UTC' });
    const tokyo = await pollOnEngineInTimeZone({ tz: 'Asia/Tokyo' });
    const newYork = await pollOnEngineInTimeZone({ tz: 'America/New_York' });

    expect(utc.emitted).toEqual(['task-1']);
    expect(tokyo.emitted).toEqual(['task-1']);
    expect(newYork.emitted).toEqual(['task-1']);
    expect(Date.parse(tokyo.window.since)).toBe(Date.parse(utc.window.since));
    expect(Date.parse(newYork.window.until)).toBe(Date.parse(utc.window.until));
    expect(utc.window.since.endsWith('Z')).toBe(true);
    expect(utc.window.until.endsWith('Z')).toBe(true);
  });
});
