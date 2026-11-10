import { HttpError, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newEventMatchingSearch as trigger } from '../src/lib/triggers/new-event-matching-search';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const CHECKPOINT_KEY = 'matching_search_checkpoint';

const vendor: FakeVendorState = {
  events: new Map<string, VendorEvent>(),
  requests: [],
  latencyMs: 0,
  failures: [],
  goneAfterDays: 0,
};

let clock = Date.parse('2026-11-01T10:00:00.000Z');

beforeEach(() => {
  vendor.events.clear();
  vendor.requests = [];
  vendor.latencyMs = 0;
  vendor.failures = [];
  vendor.goneAfterDays = 0;
  clock = Date.parse('2026-11-01T10:00:00.000Z');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(clock);
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => Reflect.apply(fakeVendor, undefined, [request]));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('New Event Matching Search behaviour', () => {
  it('fires once per new matching event across polls and a republish', async () => {
    createEvent({ id: 'old', summary: 'Interview prep' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    expect(await poll({ store })).toEqual([]);

    createEvent({ id: 'new-1', summary: 'Interview with Jane' });
    createEvent({ id: 'other', summary: 'Lunch' });
    expect(await poll({ store })).toEqual(['new-1']);
    expect(await poll({ store })).toEqual([]);

    await trigger.onDisable(hookContext({ store, isRepublish: true }));
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    expect(await poll({ store })).toEqual([]);

    createEvent({ id: 'new-2', summary: 'Interview with Sam' });
    expect(await poll({ store })).toEqual(['new-2']);
    expect(await poll({ store })).toEqual([]);
  });

  it('fires once for a new open-ended daily series, not once per occurrence', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    createSeries({ id: 'daily', summary: 'Interview slot', occurrences: 730, everyMs: DAY });

    expect(await poll({ store })).toEqual(['daily']);
    expect(await poll({ store })).toEqual([]);
  });

  it('does not fire when an old series is edited or one of its occurrences is moved', async () => {
    createSeries({ id: 'weekly', summary: 'Interview sync', occurrences: 52, everyMs: 7 * DAY });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    editEvent({ id: 'weekly' });
    moveOccurrence({ seriesId: 'weekly', index: 3 });

    expect(await poll({ store })).toEqual([]);
  });

  it('pages back to the checkpoint when more than one page of matching edits came first', async () => {
    const { store } = memoryStore();
    for (let index = 0; index < 3000; index++) {
      createEvent({ id: `edited-${index}`, summary: 'Interview archive', at: clock - 30 * DAY });
    }
    await trigger.onEnable(hookContext({ store }));

    tick(1);
    vendor.events.forEach((event) => {
      event.updated = new Date(clock).toISOString();
    });
    createEvent({ id: 'fresh', summary: 'Interview with Jane' });

    expect(await poll({ store })).toEqual(['fresh']);
    expect(vendor.requests.some((params) => params['pageToken'] !== undefined)).toBe(true);
    expect(await poll({ store })).toEqual([]);
  });

  it('does not fire for a new event that was already cancelled', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    createEvent({ id: 'gone', summary: 'Interview cancelled', status: 'cancelled' });

    expect(await poll({ store })).toEqual([]);
  });

  it('never asks Google to expand recurring events and asks for the largest page', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    await poll({ store });

    expect(vendor.requests[0]['singleEvents']).toBeUndefined();
    expect(vendor.requests[0]['maxResults']).toBe('2500');
  });

  it('moves its checkpoint while matching edits pour in and nothing new fires, then fires a later new event once', async () => {
    for (let index = 0; index < 6000; index++) {
      createEvent({ id: `busy-${index}`, summary: 'Interview archive', at: clock - 30 * DAY });
    }
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    const pagesPerPoll: number[] = [];
    const checkpoints: number[] = [];
    for (let round = 0; round < 4; round++) {
      editRange({ from: round * 1500, count: 1500 });
      const before = vendor.requests.length;
      expect(await poll({ store })).toEqual([]);
      pagesPerPoll.push(vendor.requests.length - before);
      checkpoints.push(checkpointOf({ data }).scannedThroughMs);
    }

    expect(pagesPerPoll).toEqual([1, 1, 1, 1]);
    expect(new Set(checkpoints).size).toBe(4);
    expect([...checkpoints].sort((left, right) => left - right)).toEqual(checkpoints);

    createEvent({ id: 'fresh', summary: 'Interview with Jane' });
    expect(await poll({ store })).toEqual(['fresh']);
    expect(await poll({ store })).toEqual([]);
  });

  it('stops paging before the listing budget, keeps the checkpoint at the last full page and finishes next poll', async () => {
    for (let index = 0; index < 6000; index++) {
      createEvent({ id: `edited-${index}`, summary: 'Interview archive', at: clock - 30 * DAY });
    }
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    editRange({ from: 0, count: 6000 });
    createEvent({ id: 'fresh', summary: 'Interview with Jane' });

    vendor.latencyMs = 12_000;
    tick(5);
    const startedAt = clock;
    const before = vendor.requests.length;
    expect((await trigger.run(hookContext({ store }))).map(idOf)).toEqual([]);
    expect(clock - startedAt).toBeLessThan(25_000);
    expect(vendor.requests.length - before).toBe(2);
    expect(checkpointOf({ data }).scannedThroughMs).toBe(Date.parse(eventById({ id: 'edited-4999' }).updated));

    vendor.latencyMs = 0;
    expect(await poll({ store })).toEqual(['fresh']);
    expect(await poll({ store })).toEqual([]);
  });

  it('keeps the pages it scanned when a later page fails and continues on the next poll', async () => {
    for (let index = 0; index < 3000; index++) {
      createEvent({ id: `edited-${index}`, summary: 'Interview archive', at: clock - 30 * DAY });
    }
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'early', summary: 'Interview early' });
    editRange({ from: 0, count: 3000 });
    createEvent({ id: 'late', summary: 'Interview late' });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    vendor.failures = [0, 500];
    expect(await poll({ store })).toEqual(['early']);
    expect(await poll({ store })).toEqual(['late']);
    expect(await poll({ store })).toEqual([]);
  });

  it('keeps up on a quiet search for longer than Google accepts as updatedMin and fires the next match once', async () => {
    vendor.goneAfterDays = 20;
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const enabledAt = clock;
    while (clock < enabledAt + 20 * DAY - 70 * MINUTE) {
      createEvent({ id: `lunch-${clock}`, summary: 'Lunch' });
      tick(55);
      expect(await poll({ store })).toEqual([]);
    }

    clock = enabledAt + 20 * DAY;
    createEvent({ id: 'board', summary: 'Interview with the board' });
    expect(await poll({ store })).toEqual(['board']);
    expect(await poll({ store })).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('re-baselines and logs when a republished flow was off for longer than Google accepts', async () => {
    vendor.goneAfterDays = 20;
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    tick(30 * 24 * 60);
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    createEvent({ id: 'during-gap', summary: 'Interview during gap' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(await poll({ store })).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('were skipped and will not fire'));
    expect(checkpointOf({ data }).scannedThroughMs).toBe(clock + 1);

    createEvent({ id: 'after', summary: 'Interview after' });
    expect(await poll({ store })).toEqual(['after']);
    expect(await poll({ store })).toEqual([]);
  });

  it('resumes at most 24 hours back from an old lastPoll of the previous version and logs the skipped part', async () => {
    const { store, data } = memoryStore();
    data.set('lastPoll', JSON.stringify(clock - 30 * DAY));
    createEvent({ id: 'weeks-old', summary: 'Interview weeks ago', at: clock - 10 * DAY });
    createEvent({ id: 'old-edited', summary: 'Interview edited today', at: clock - 10 * DAY });
    editEvent({ id: 'old-edited' });
    createEvent({ id: 'recent', summary: 'Interview this morning', at: clock - 2 * 60 * MINUTE });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('is more than 24 hours old'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('were skipped and will not fire'));

    expect(await poll({ store })).toEqual(['recent']);
    expect(Date.parse(vendor.requests[0]['updatedMin'])).toBeGreaterThanOrEqual(clock - DAY - 10 * MINUTE);
    expect(await poll({ store })).toEqual([]);
  });

  it('keeps the checkpoint across a republish so an event created in between fires once', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'between', summary: 'Interview between' });

    await trigger.onDisable(hookContext({ store, isRepublish: true }));
    await trigger.onEnable(hookContext({ store, isRepublish: true }));

    expect(await poll({ store })).toEqual(['between']);
    expect(await poll({ store })).toEqual([]);
  });

  it('starts from now on a plain re-enable or when the search changes on republish', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'while-off', summary: 'Interview while off' });
    await trigger.onDisable(hookContext({ store }));
    await trigger.onEnable(hookContext({ store }));
    expect(await poll({ store })).toEqual([]);

    createEvent({ id: 'demo-before', summary: 'Demo before' });
    await trigger.onEnable(hookContext({ store, isRepublish: true, searchTerm: 'demo' }));
    expect(await poll({ store, searchTerm: 'demo' })).toEqual([]);
    createEvent({ id: 'demo-after', summary: 'Demo after' });
    expect(await poll({ store, searchTerm: 'demo' })).toEqual(['demo-after']);
  });

  it('fires both events that share one timestamp when the second becomes visible later', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'tie-a', summary: 'Interview A' });
    const sharedTime = eventById({ id: 'tie-a' }).updated;
    expect(await quickPoll({ store, seconds: 10 })).toEqual(['tie-a']);

    vendor.events.set('tie-b', { ...eventById({ id: 'tie-a' }), id: 'tie-b', summary: 'Interview B', created: sharedTime, updated: sharedTime });
    expect(await quickPoll({ store, seconds: 10 })).toEqual(['tie-b']);
    expect(await poll({ store })).toEqual([]);
  });

  it('does not fire again an event whose update falls inside the visibility margin of the last scan', async () => {
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'fresh', summary: 'Interview fresh' });

    expect(await quickPoll({ store, seconds: 20 })).toEqual(['fresh']);
    const { scannedThroughMs, seen } = checkpointOf({ data });
    expect(Date.parse(eventById({ id: 'fresh' }).updated)).toBeGreaterThanOrEqual(scannedThroughMs);
    expect(seen).toContain('fresh');

    expect(await quickPoll({ store, seconds: 20 })).toEqual([]);
    expect(await poll({ store })).toEqual([]);
    expect(checkpointOf({ data }).seen).not.toContain('fresh');
  });

  it('continues from the lastPoll saved by the previous version on republish', async () => {
    const { store, data } = memoryStore();
    createEvent({ id: 'already-fired', summary: 'Interview fired' });
    data.set('lastPoll', JSON.stringify(Date.parse(eventById({ id: 'already-fired' }).updated)));
    createEvent({ id: 'missed', summary: 'Interview missed' });

    await trigger.onEnable(hookContext({ store, isRepublish: true }));

    expect(await poll({ store })).toEqual(['missed']);
    expect(await poll({ store })).toEqual([]);
  });

  it('does not fire again an invitation the previous version fired when the organizer edits it after the upgrade', async () => {
    const { store, data } = memoryStore();
    createInvite({ id: 'fired-invite', summary: 'Interview with Acme', createdAt: clock });
    data.set('lastPoll', JSON.stringify(Date.parse(eventById({ id: 'fired-invite' }).updated)));
    editInvite({ id: 'fired-invite' });
    createInvite({ id: 'new-invite', summary: 'Interview with Globex', createdAt: clock + MINUTE });

    await trigger.onEnable(hookContext({ store, isRepublish: true }));

    expect(await poll({ store })).toEqual(['new-invite']);
    expect(await poll({ store })).toEqual([]);
    editInvite({ id: 'fired-invite' });
    expect(await poll({ store })).toEqual([]);
  });

  it('fires 600 new events created in the minute before a poll once each and never again', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    tick(5);
    const burstIds = Array.from({ length: 600 }, (_, index) => `burst-${index}`);
    burstIds.forEach((id, index) => {
      const at = new Date(clock - 59_000 + index * 90).toISOString();
      vendor.events.set(id, baseEvent({ id, summary: 'Interview slot', created: at, updated: at, startMs: clock + DAY }));
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const fired = (await trigger.run(hookContext({ store }))).map(idOf);
    expect(fired).toHaveLength(600);
    expect(new Set(fired)).toEqual(new Set(burstIds));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('checkpoint advanced past the visibility margin'));

    expect(await quickPoll({ store, seconds: 10 })).toEqual([]);
    expect(await poll({ store })).toEqual([]);
    createEvent({ id: 'after-burst', summary: 'Interview after burst' });
    expect(await poll({ store })).toEqual(['after-burst']);
    expect(await poll({ store })).toEqual([]);
  });

  it('fires once for a new event that was edited before the check', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'edited-new', summary: 'Interview with guests' });
    tick(1);
    const event = eventById({ id: 'edited-new' });
    event.updated = new Date(clock).toISOString();

    expect(await poll({ store })).toEqual(['edited-new']);
    expect(await poll({ store })).toEqual([]);
  });

  it('does not fire again when an event it already fired is edited later', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'fired', summary: 'Interview fired' });
    expect(await poll({ store })).toEqual(['fired']);

    expect(await quickPoll({ store, seconds: 5 })).toEqual([]);
    editEvent({ id: 'fired' });
    expect(await quickPoll({ store, seconds: 5 })).toEqual([]);
    expect(await poll({ store })).toEqual([]);
    editEvent({ id: 'fired' });
    expect(await poll({ store })).toEqual([]);
  });

  it('fires once when you are invited after turn-on to a meeting the organizer created earlier', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createInvite({ id: 'old-meeting', summary: 'Interview panel', createdAt: clock - 30 * DAY });

    expect(await poll({ store })).toEqual(['old-meeting']);
    editInvite({ id: 'old-meeting' });
    expect(await quickPoll({ store, seconds: 10 })).toEqual([]);
    expect(await poll({ store })).toEqual([]);
    editInvite({ id: 'old-meeting' });
    expect(await poll({ store })).toEqual([]);
    answerInvite({ id: 'old-meeting', responseStatus: 'accepted' });
    expect(await poll({ store })).toEqual([]);
    editInvite({ id: 'old-meeting' });
    expect(await poll({ store })).toEqual([]);
  });

  it('fires once for an invitation to one occurrence of a series whose master is not on the calendar', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createInvite({
      id: 'daily-standup_20261114T090000Z',
      summary: 'Interview debrief',
      createdAt: clock - 60 * DAY,
      recurringEventId: 'daily-standup',
    });

    expect(await poll({ store })).toEqual(['daily-standup_20261114T090000Z']);
    expect(await poll({ store })).toEqual([]);
  });

  it('does not fire for an unanswered invitation that already existed at turn-on', async () => {
    createInvite({ id: 'waiting', summary: 'Interview waiting', createdAt: clock - 10 * DAY });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    expect(await poll({ store })).toEqual([]);
    createEvent({ id: 'own-new', summary: 'Interview own' });
    expect(await poll({ store })).toEqual(['own-new']);
    expect(await poll({ store })).toEqual([]);
  });

  it('does not fire a moved occurrence of a series invitation that already fired', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createInvite({ id: 'weekly-sync', summary: 'Interview sync', createdAt: clock - 5 * DAY });
    expect(await poll({ store })).toEqual(['weekly-sync']);

    createInvite({ id: 'weekly-sync_20261120T100000Z', summary: 'Interview sync', createdAt: clock - 5 * DAY, recurringEventId: 'weekly-sync' });
    expect(await poll({ store })).toEqual([]);
  });

  it('does not fire an invitation again after the seen cap cuts the own-event list', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createInvite({ id: 'invite', summary: 'Interview invite', createdAt: clock - 30 * DAY });
    expect(await poll({ store })).toEqual(['invite']);

    tick(5);
    Array.from({ length: 600 }, (_, index) => `burst-${index}`).forEach((id, index) => {
      const at = new Date(clock - 59_000 + index * 90).toISOString();
      vendor.events.set(id, baseEvent({ id, summary: 'Interview slot', created: at, updated: at, startMs: clock + DAY }));
    });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await trigger.run(hookContext({ store }))).toHaveLength(600);

    editInvite({ id: 'invite' });
    expect(await quickPoll({ store, seconds: 10 })).toEqual([]);
    expect(await poll({ store })).toEqual([]);
  });

  it('does not fire an invitation again after a plain turn off and on when the organizer edits it', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createInvite({ id: 'old-meeting', summary: 'Interview panel', createdAt: clock - 30 * DAY });
    expect(await poll({ store })).toEqual(['old-meeting']);

    await trigger.onDisable(hookContext({ store }));
    await trigger.onEnable(hookContext({ store }));

    editInvite({ id: 'old-meeting' });
    expect(await poll({ store })).toEqual([]);
    expect(await poll({ store })).toEqual([]);
  });

  it('does not fire an invitation again after the search changes when the organizer edits it', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createInvite({ id: 'panel', summary: 'Interview demo panel', createdAt: clock - 30 * DAY });
    expect(await poll({ store })).toEqual(['panel']);

    await trigger.onEnable(hookContext({ store, isRepublish: true, searchTerm: 'demo' }));
    editInvite({ id: 'panel' });
    expect(await poll({ store, searchTerm: 'demo' })).toEqual([]);
  });

  it('treats your own meeting with guests as an own event, never as an invitation', async () => {
    createOwnWithGuests({ id: 'own-older', summary: 'Interview loop', createdAt: clock - 20 * DAY });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    editInvite({ id: 'own-older' });
    expect(await poll({ store })).toEqual([]);

    createOwnWithGuests({ id: 'own-new', summary: 'Interview with guests' });
    expect(await poll({ store })).toEqual(['own-new']);
    editInvite({ id: 'own-new' });
    expect(await poll({ store })).toEqual([]);
  });

  it('fires a series invitation once when one of its occurrences is listed before the series itself', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createInvite({ id: 'weekly-sync_20261120T100000Z', summary: 'Interview sync', createdAt: clock - 5 * DAY, recurringEventId: 'weekly-sync' });
    createInvite({ id: 'weekly-sync', summary: 'Interview sync', createdAt: clock - 5 * DAY });

    expect(await poll({ store })).toEqual(['weekly-sync']);
    expect(await poll({ store })).toEqual([]);
  });

  it('fires a series invitation once when one occurrence is listed in an earlier poll than the series', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createInvite({ id: 'weekly-sync_20261120T100000Z', summary: 'Interview sync', createdAt: clock - 5 * DAY, recurringEventId: 'weekly-sync' });
    expect(await poll({ store })).toEqual(['weekly-sync_20261120T100000Z']);

    createInvite({ id: 'weekly-sync', summary: 'Interview sync', createdAt: clock - 5 * DAY });
    expect(await poll({ store })).toEqual([]);
  });

  it('does not fire an invitation that is already accepted or declined when first seen', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createInvite({ id: 'accepted-invite', summary: 'Interview accepted', createdAt: clock - 3 * DAY });
    answerInvite({ id: 'accepted-invite', responseStatus: 'accepted' });
    createInvite({ id: 'declined-invite', summary: 'Interview declined', createdAt: clock - 3 * DAY });
    answerInvite({ id: 'declined-invite', responseStatus: 'declined' });

    expect(await poll({ store })).toEqual([]);
  });

  it('fires a separate invitation to another occurrence of the same series once', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createInvite({ id: 'ser_20261114T090000Z', summary: 'Interview series', createdAt: clock - 30 * DAY, recurringEventId: 'ser' });
    expect(await poll({ store })).toEqual(['ser_20261114T090000Z']);

    createInvite({ id: 'ser_20261121T090000Z', summary: 'Interview series', createdAt: clock - 30 * DAY, recurringEventId: 'ser' });
    expect(await poll({ store })).toEqual(['ser_20261121T090000Z']);
    editInvite({ id: 'ser_20261121T090000Z' });
    expect(await poll({ store })).toEqual([]);
  });

  it('blocks moved occurrences once the whole series arrives after one of its occurrences fired', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createInvite({ id: 'ser_20261114T090000Z', summary: 'Interview series', createdAt: clock - 30 * DAY, recurringEventId: 'ser' });
    expect(await poll({ store })).toEqual(['ser_20261114T090000Z']);

    createInvite({ id: 'ser', summary: 'Interview series', createdAt: clock - 30 * DAY });
    expect(await poll({ store })).toEqual([]);
    createInvite({ id: 'ser_20261128T090000Z', summary: 'Interview series', createdAt: clock - 30 * DAY, recurringEventId: 'ser' });
    expect(await poll({ store })).toEqual([]);
  });

  it('forgets an invitation once it is answered so it does not count toward the cap', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    createInvite({ id: 'answered', summary: 'Interview answered', createdAt: clock - 900 * DAY });
    expect(await poll({ store })).toEqual(['answered']);
    answerInvite({ id: 'answered', responseStatus: 'accepted' });
    expect(await poll({ store })).toEqual([]);

    Array.from({ length: 500 }, (_, index) => `open-${index}`).forEach((id, index) =>
      createInvite({ id, summary: 'Interview open', createdAt: clock - (600 - index) * DAY })
    );
    expect(await poll({ store })).toHaveLength(500);
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('unanswered invitations'));
  });

  it('test() returns matching new events with the optional props blank', async () => {
    createEvent({ id: 'sample', summary: 'Interview with Kim' });
    const { store } = memoryStore();

    const sample = await trigger.test(hookContext({ store }));

    expect(sample.map(idOf)).toEqual(['sample']);
  });

  it('every sampleData key exists in a real run item', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'real', summary: 'Interview with Lee' });
    const created = vendor.events.get('real');
    if (created) {
      created.description = 'Panel interview';
    }

    const [real] = await trigger.run(hookContext({ store }));

    for (const key of Object.keys(trigger.sampleData)) {
      expect(real).toHaveProperty(key);
    }
  });
});

function tick(minutes: number): void {
  clock += minutes * MINUTE;
  vi.setSystemTime(clock);
}

function createEvent({ id, summary, at, status }: { id: string; summary: string; at?: number; status?: string }): void {
  tick(1);
  const time = new Date(at ?? clock).toISOString();
  vendor.events.set(id, baseEvent({ id, summary, created: time, updated: time, startMs: clock + DAY, status }));
}

function createSeries({ id, summary, occurrences, everyMs }: { id: string; summary: string; occurrences: number; everyMs: number }): void {
  tick(1);
  const time = new Date(clock).toISOString();
  vendor.events.set(id, { ...baseEvent({ id, summary, created: time, updated: time, startMs: clock + DAY }), recurrence: ['RRULE:FREQ=DAILY'] });
  for (let index = 0; index < occurrences; index++) {
    const instanceId = `${id}_${index}`;
    vendor.events.set(instanceId, {
      ...baseEvent({ id: instanceId, summary, created: time, updated: time, startMs: clock + DAY + index * everyMs }),
      recurringEventId: id,
      expandedInstance: true,
    });
  }
}

function editRange({ from, count }: { from: number; count: number }): void {
  tick(1);
  const editedEvents = Array.from(vendor.events.values()).slice(from, from + count);
  editedEvents.forEach((event, index) => {
    event.updated = new Date(clock + index).toISOString();
  });
  clock += count;
  vi.setSystemTime(clock);
}

function eventById({ id }: { id: string }): VendorEvent {
  const event = vendor.events.get(id);
  if (!event) {
    throw new Error(`no event ${id}`);
  }
  return event;
}

function checkpointOf({ data }: { data: Map<string, string> }): { scannedThroughMs: number; seen: string[] } {
  const raw = data.get(CHECKPOINT_KEY);
  const parsed: unknown = raw === undefined ? null : JSON.parse(raw);
  if (typeof parsed === 'object' && parsed !== null && 'scannedThroughMs' in parsed && 'seen' in parsed && typeof parsed.scannedThroughMs === 'number' && Array.isArray(parsed.seen)) {
    const seen: unknown[] = parsed.seen;
    return { scannedThroughMs: parsed.scannedThroughMs, seen: seen.map((entry) => (typeof entry === 'object' && entry !== null && 'id' in entry ? String(entry.id) : '')) };
  }
  throw new Error('no checkpoint');
}

function createInvite({ id, summary, createdAt, recurringEventId }: { id: string; summary: string; createdAt: number; recurringEventId?: string }): void {
  tick(1);
  const invitedAt = new Date(clock).toISOString();
  vendor.events.set(id, {
    ...baseEvent({ id, summary, created: new Date(createdAt).toISOString(), updated: invitedAt, startMs: clock + DAY }),
    organizer: { email: 'organizer@other.example.com', self: false },
    attendees: [
      { email: 'organizer@other.example.com', responseStatus: 'accepted' },
      { email: 'me@example.com', self: true, responseStatus: 'needsAction' },
    ],
    ...(recurringEventId ? { recurringEventId } : {}),
  });
}

function createOwnWithGuests({ id, summary, createdAt }: { id: string; summary: string; createdAt?: number }): void {
  tick(1);
  const now = new Date(clock).toISOString();
  vendor.events.set(id, {
    ...baseEvent({ id, summary, created: createdAt === undefined ? now : new Date(createdAt).toISOString(), updated: now, startMs: clock + DAY }),
    organizer: { email: 'me@example.com', self: true },
    attendees: [
      { email: 'me@example.com', self: true, organizer: true, responseStatus: 'accepted' },
      { email: 'guest@other.example.com', responseStatus: 'needsAction' },
      { email: 'second-guest@other.example.com', responseStatus: 'accepted' },
    ],
  });
}

function editInvite({ id }: { id: string }): void {
  tick(1);
  eventById({ id }).updated = new Date(clock).toISOString();
}

function answerInvite({ id, responseStatus }: { id: string; responseStatus: string }): void {
  tick(1);
  const event = eventById({ id });
  event.attendees = (event.attendees ?? []).map((attendee) => (attendee.self ? { ...attendee, responseStatus } : attendee));
  event.updated = new Date(clock).toISOString();
}

function editEvent({ id }: { id: string }): void {
  tick(1);
  const updated = new Date(clock).toISOString();
  vendor.events.forEach((event) => {
    if (event.id === id || event.recurringEventId === id) {
      event.updated = updated;
    }
  });
}

function moveOccurrence({ seriesId, index }: { seriesId: string; index: number }): void {
  tick(1);
  const instance = vendor.events.get(`${seriesId}_${index}`);
  if (instance) {
    const now = new Date(clock).toISOString();
    instance.created = now;
    instance.updated = now;
    instance.expandedInstance = false;
  }
}

function baseEvent({ id, summary, created, updated, startMs, status }: { id: string; summary: string; created: string; updated: string; startMs: number; status?: string }): VendorEvent {
  return {
    kind: 'calendar#event',
    id,
    status: status ?? 'confirmed',
    summary,
    created,
    updated,
    start: { dateTime: new Date(startMs).toISOString() },
    end: { dateTime: new Date(startMs + 30 * MINUTE).toISOString() },
    organizer: { email: 'organizer@example.com' },
  };
}

async function fakeVendor(request: HttpRequest): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
  if (vendor.latencyMs > 0) {
    clock += vendor.latencyMs;
    vi.setSystemTime(clock);
  }
  const updatedMin = request.queryParams?.['updatedMin'];
  const tooOld = vendor.goneAfterDays > 0 && updatedMin !== undefined && Date.parse(updatedMin) < clock - vendor.goneAfterDays * DAY;
  const failure = tooOld ? 410 : vendor.failures.shift();
  if (failure !== undefined && failure !== 0) {
    vendor.requests.push({ ...(request.queryParams ?? {}) });
    throw new HttpError(request.body, { status: failure, responseBody: { error: { code: failure } } });
  }
  return { status: 200, headers: {}, body: listEvents(request) };
}

function listEvents(request: HttpRequest): { items: VendorEvent[]; nextPageToken?: string } {
  const params: Record<string, string> = { ...(request.queryParams ?? {}) };
  vendor.requests.push(params);
  const expand = params['singleEvents'] === 'true';
  const updatedMin = params['updatedMin'] ? Date.parse(params['updatedMin']) : 0;
  const term = (params['q'] ?? '').toLowerCase();
  const visible = Array.from(vendor.events.values())
    .filter((event) => (expand ? !event.recurrence : !event.expandedInstance))
    .filter((event) => Date.parse(event.updated) >= updatedMin)
    .filter((event) => event.status !== 'cancelled' || params['showDeleted'] === 'true' || params['updatedMin'] !== undefined)
    .filter((event) => term === '' || event.summary.toLowerCase().includes(term))
    .sort((left, right) => Date.parse(left.updated) - Date.parse(right.updated));
  const pageSize = Math.min(Number(params['maxResults'] ?? '250'), 2500);
  const offset = Number(params['pageToken'] ?? '0');
  const page = visible.slice(offset, offset + pageSize).map(({ expandedInstance: _expanded, ...event }) => event);
  return offset + pageSize < visible.length ? { items: page, nextPageToken: String(offset + pageSize) } : { items: page };
}

async function quickPoll({ store, seconds }: { store: Store; seconds: number }): Promise<string[]> {
  clock += seconds * 1000;
  vi.setSystemTime(clock);
  return (await trigger.run(hookContext({ store }))).map(idOf);
}

async function poll({ store, searchTerm }: { store: Store; searchTerm?: string }): Promise<string[]> {
  tick(5);
  return (await trigger.run(hookContext({ store, searchTerm }))).map(idOf);
}

function idOf(item: unknown): string {
  return typeof item === 'object' && item !== null && 'id' in item ? String(item.id) : '';
}

function memoryStore(): { store: Store; data: Map<string, string> } {
  const data = new Map<string, string>();
  const store: Store = {
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, JSON.stringify(value));
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      const raw = data.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
  return { store, data };
}

function hookContext({ store, isRepublish, searchTerm }: { store: Store; isRepublish?: boolean; searchTerm?: string }): Parameters<typeof trigger.run>[0] {
  return Reflect.apply(fakeContext, undefined, [{ store, isRepublish, searchTerm }]);
}

function fakeContext({ store, isRepublish, searchTerm }: { store: Store; isRepublish?: boolean; searchTerm?: string }) {
  return {
    store,
    isRepublish,
    auth: { type: AppConnectionType.OAUTH2, access_token: 'token-123', data: {} },
    propsValue: { calendar_id: 'primary', search_term: searchTerm ?? 'interview', event_types: undefined, search_fields: undefined },
    files: {},
  };
}

type FakeVendorState = {
  events: Map<string, VendorEvent>;
  requests: Record<string, string>[];
  latencyMs: number;
  failures: number[];
  goneAfterDays: number;
};

type VendorEvent = {
  kind: string;
  id: string;
  status: string;
  summary: string;
  description?: string;
  created: string;
  updated: string;
  start: { dateTime: string };
  end: { dateTime: string };
  organizer: { email: string; self?: boolean };
  attendees?: { email: string; self?: boolean; organizer?: boolean; responseStatus: string }[];
  recurrence?: string[];
  recurringEventId?: string;
  expandedInstance?: boolean;
};
