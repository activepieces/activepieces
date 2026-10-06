import { isRecord } from './client';
import type { GoogleAdsRow } from './client';

export function createEventsQuery({ changeEventType, after, until, order, limit }: CreateEventsQueryParams): string {
  if (!/^[A-Z_]+$/.test(changeEventType)) {
    throw new Error(`Invalid change event resource type "${changeEventType}".`);
  }
  assertTimestamp(after);
  assertTimestamp(until);
  return [
    'SELECT change_event.resource_name, change_event.change_date_time, change_event.change_resource_name FROM change_event',
    `WHERE change_event.change_date_time > '${after}' AND change_event.change_date_time <= '${until}'`,
    `AND change_event.change_resource_type = '${changeEventType}' AND change_event.resource_change_operation = 'CREATE'`,
    `ORDER BY change_event.change_date_time ${order} LIMIT ${limit}`,
  ].join(' ');
}

export function toCreateEvents(rows: GoogleAdsRow[]): CreateEvent[] {
  return rows.flatMap((row) => {
    const event = isRecord(row['changeEvent']) ? row['changeEvent'] : {};
    const eventName = event['resourceName'];
    const time = event['changeDateTime'];
    const resourceName = event['changeResourceName'];
    if (typeof eventName !== 'string' || typeof time !== 'string' || typeof resourceName !== 'string') {
      return [];
    }
    return [{ id: eventName.split('/').pop() ?? eventName, time, resourceName }];
  });
}

export function eventWindow(now: Date): { start: string; end: string } {
  return {
    start: formatTime(new Date(now.getTime() - 29 * DAY_MS)).slice(0, 10),
    end: formatTime(new Date(now.getTime() + 2 * DAY_MS)).slice(0, 10),
  };
}

export function baselineState({ events, now, limit }: { events: CreateEvent[]; now: Date; limit: number }): CreateEventState {
  const start = eventWindow(now).start;
  const oldest = events.reduce((min, event) => (event.time < min ? event.time : min), events[0]?.time ?? start);
  return settle({ floor: start, groups: groupByTime(events), minFloor: events.length >= limit ? oldest : start });
}

export function absorbEvents({ state, events, limit }: { state: CreateEventState; events: CreateEvent[]; limit: number }): AbsorbResult {
  const seen = new Set(state.seen.flatMap((group) => group.ids));
  const fresh = events.filter((event) => !seen.has(event.id));
  const stalled = events.length >= limit && fresh.length === 0;
  const last = events[events.length - 1]?.time ?? state.floor;
  return {
    fresh,
    state: settle({ floor: state.floor, groups: [...state.seen, ...groupByTime(events)], minFloor: stalled ? last : state.floor }),
  };
}

function settle({ floor, groups, minFloor }: { floor: string; groups: SeenGroup[]; minFloor: string }): CreateEventState {
  const merged = mergeGroups(groups);
  const newest = merged[merged.length - 1];
  let current = latest([floor, minFloor, newest ? minusMinutes({ time: newest.time, minutes: OVERLAP_MINUTES }) : floor]);
  let kept = merged.filter((group) => group.time > current);
  while (kept.length > 1 && kept.reduce((total, group) => total + group.ids.length, 0) > SEEN_CAP) {
    current = kept[0].time;
    kept = kept.slice(1);
  }
  return { floor: current, seen: kept };
}

function groupByTime(events: CreateEvent[]): SeenGroup[] {
  return events.map((event) => ({ time: event.time, ids: [event.id] }));
}

function mergeGroups(groups: SeenGroup[]): SeenGroup[] {
  const byTime = new Map<string, Set<string>>();
  for (const group of groups) {
    const ids = byTime.get(group.time) ?? new Set<string>();
    group.ids.forEach((id) => ids.add(id));
    byTime.set(group.time, ids);
  }
  return [...byTime.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([time, ids]) => ({ time, ids: [...ids] }));
}

function latest(times: string[]): string {
  return times.reduce((max, time) => (time > max ? time : max));
}

function minusMinutes({ time, minutes }: { time: string; minutes: number }): string {
  const match = TIMESTAMP.exec(time);
  if (match === null) {
    throw new Error(`Invalid change event time "${time}".`);
  }
  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
  const millis = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  return formatTime(new Date(millis - minutes * 60_000));
}

function formatTime(date: Date): string {
  const iso = date.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)}`;
}

function assertTimestamp(time: string): void {
  if (!TIMESTAMP.test(time)) {
    throw new Error(`Invalid change event time "${time}".`);
  }
}

const TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?)?$/;
const DAY_MS = 86_400_000;

export const OVERLAP_MINUTES = 10;
export const SEEN_CAP = 5_000;
export const EVENTS_PER_POLL = 10_000;

export type CreateEvent = { id: string; time: string; resourceName: string };

export type SeenGroup = { time: string; ids: string[] };

export type CreateEventState = { floor: string; seen: SeenGroup[] };

type AbsorbResult = { fresh: CreateEvent[]; state: CreateEventState };

type CreateEventsQueryParams = { changeEventType: string; after: string; until: string; order: 'ASC' | 'DESC'; limit: number };
