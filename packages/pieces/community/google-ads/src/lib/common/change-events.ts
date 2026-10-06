import { isRecord } from './client';
import type { GoogleAdsRow } from './client';

export function createEventsQuery({ changeEventType, after, until, order, limit }: CreateEventsQueryParams): string {
  assertEventType(changeEventType);
  assertTimestamp(after);
  assertTimestamp(until);
  return [
    SELECT_EVENTS,
    `WHERE change_event.change_date_time > '${after}' AND change_event.change_date_time <= '${until}'`,
    createdFilter(changeEventType),
    `ORDER BY change_event.change_date_time ${order}, ad_group.id ${order} LIMIT ${limit}`,
  ].join(' ');
}

export function boundaryEventsQuery({ changeEventType, boundary, limit }: BoundaryEventsQueryParams): string {
  assertEventType(changeEventType);
  assertTimestamp(boundary.time);
  assertAdGroupId(boundary.adGroupId);
  return [
    SELECT_EVENTS,
    `WHERE change_event.change_date_time >= '${boundary.time}' AND change_event.change_date_time <= '${boundary.time}'`,
    createdFilter(changeEventType),
    `AND ad_group.id >= ${boundary.adGroupId} ORDER BY ad_group.id ASC LIMIT ${limit}`,
  ].join(' ');
}

export function planEventsQuery({ changeEventType, state, now, limit }: PlanEventsQueryParams): { state: CreateEventState; query: string } {
  const window = eventWindow(now);
  const boundary = state.boundary;
  if (boundary !== undefined && boundary.time >= window.start) {
    return { state, query: boundaryEventsQuery({ changeEventType, boundary, limit }) };
  }
  const current = boundary === undefined ? state : leaveBoundary({ state, time: boundary.time });
  const after = latest([current.floor, window.start]);
  return { state: current, query: createEventsQuery({ changeEventType, after, until: window.end, order: 'ASC', limit }) };
}

export function toCreateEvents(rows: GoogleAdsRow[]): CreateEvent[] {
  return rows.flatMap((row) => {
    const event = isRecord(row['changeEvent']) ? row['changeEvent'] : {};
    const adGroup = isRecord(row['adGroup']) ? row['adGroup'] : {};
    const eventName = event['resourceName'];
    const time = event['changeDateTime'];
    const resourceName = event['changeResourceName'];
    const adGroupId = typeof adGroup['id'] === 'number' ? String(adGroup['id']) : adGroup['id'];
    if (typeof eventName !== 'string' || typeof time !== 'string' || typeof resourceName !== 'string') {
      return [];
    }
    if (typeof adGroupId !== 'string' || !AD_GROUP_ID.test(adGroupId)) {
      return [];
    }
    return [{ id: eventName.split('/').pop() ?? eventName, time, resourceName, adGroupId }];
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

export function absorbEvents({ state, events, full }: AbsorbParams): AbsorbResult {
  const known = new Set([...state.seen.flatMap((group) => group.ids), ...(state.boundary?.ids ?? [])]);
  const fresh = events.filter((event) => !known.has(event.id));
  if (state.boundary === undefined) {
    return { fresh, state: absorbPage({ state, events, full }) };
  }
  return { fresh, ...absorbBoundary({ state, boundary: state.boundary, events, full }) };
}

function absorbPage({ state, events, full }: AbsorbParams): CreateEventState {
  if (!full || events.length === 0) {
    return settle({ floor: state.floor, groups: [...state.seen, ...groupByTime(events)], minFloor: state.floor });
  }
  const last = events.reduce((max, event) => (compareEvents({ a: event, b: max }) > 0 ? event : max));
  const known = state.seen.filter((group) => group.time === last.time).flatMap((group) => group.ids);
  const reached = events.filter((event) => event.time === last.time && event.adGroupId === last.adGroupId).map((event) => event.id);
  return {
    floor: state.floor,
    seen: state.seen.filter((group) => group.time > last.time),
    boundary: { time: last.time, adGroupId: last.adGroupId, ids: [...new Set([...known, ...reached])] },
  };
}

function absorbBoundary({ state, boundary, events, full }: AbsorbParams & { boundary: BoundaryCursor }): BoundaryResult {
  const page = events.filter((event) => event.time === boundary.time);
  if (!full || page.length === 0) {
    return { state: leaveBoundary({ state, time: boundary.time }) };
  }
  const returned = new Set(page.map((event) => event.id));
  const pending = boundary.ids.filter((id) => !returned.has(id));
  const lastGroup = page.reduce((max, event) => (compareIds({ a: event.adGroupId, b: max }) > 0 ? event.adGroupId : max), boundary.adGroupId);
  if (lastGroup !== boundary.adGroupId) {
    const reached = page.filter((event) => event.adGroupId === lastGroup).map((event) => event.id);
    return { state: { floor: state.floor, seen: state.seen, boundary: { time: boundary.time, adGroupId: lastGroup, ids: [...new Set([...pending, ...reached])] } } };
  }
  const ids = [...new Set([...boundary.ids, ...returned])];
  if (ids.length > boundary.ids.length && ids.length <= MAX_BOUNDARY_IDS) {
    return { state: { floor: state.floor, seen: state.seen, boundary: { time: boundary.time, adGroupId: lastGroup, ids } } };
  }
  return {
    state: { floor: state.floor, seen: state.seen, boundary: { time: boundary.time, adGroupId: nextId(lastGroup), ids: pending } },
    overflow: { time: boundary.time, adGroupId: lastGroup },
  };
}

function leaveBoundary({ state, time }: { state: CreateEventState; time: string }): CreateEventState {
  return settle({ floor: latest([state.floor, time]), groups: state.seen, minFloor: time });
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

function compareEvents({ a, b }: { a: CreateEvent; b: CreateEvent }): number {
  if (a.time !== b.time) {
    return a.time < b.time ? -1 : 1;
  }
  return compareIds({ a: a.adGroupId, b: b.adGroupId });
}

function compareIds({ a, b }: { a: string; b: string }): number {
  if (a.length !== b.length) {
    return a.length - b.length;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

function nextId(id: string): string {
  return String(BigInt(id) + BigInt(1));
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

function createdFilter(changeEventType: string): string {
  return `AND change_event.change_resource_type = '${changeEventType}' AND change_event.resource_change_operation = 'CREATE'`;
}

function assertEventType(changeEventType: string): void {
  if (!/^[A-Z_]+$/.test(changeEventType)) {
    throw new Error(`Invalid change event resource type "${changeEventType}".`);
  }
}

function assertTimestamp(time: string): void {
  if (!TIMESTAMP.test(time)) {
    throw new Error(`Invalid change event time "${time}".`);
  }
}

function assertAdGroupId(id: string): void {
  if (!AD_GROUP_ID.test(id)) {
    throw new Error(`Invalid ad group id "${id}".`);
  }
}

const SELECT_EVENTS = 'SELECT change_event.resource_name, change_event.change_date_time, change_event.change_resource_name, ad_group.id FROM change_event';
const TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?)?$/;
const AD_GROUP_ID = /^(?:0|[1-9]\d{0,18})$/;
const DAY_MS = 86_400_000;
const MAX_BOUNDARY_IDS = 15_000;

export const OVERLAP_MINUTES = 10;
export const SEEN_CAP = 5_000;
export const EVENTS_PER_POLL = 10_000;

export type CreateEvent = { id: string; time: string; resourceName: string; adGroupId: string };

export type SeenGroup = { time: string; ids: string[] };

export type BoundaryCursor = { time: string; adGroupId: string; ids: string[] };

export type CreateEventState = { floor: string; seen: SeenGroup[]; boundary?: BoundaryCursor };

type AbsorbParams = { state: CreateEventState; events: CreateEvent[]; full: boolean };

type BoundaryResult = { state: CreateEventState; overflow?: { time: string; adGroupId: string } };

type AbsorbResult = BoundaryResult & { fresh: CreateEvent[] };

type CreateEventsQueryParams = { changeEventType: string; after: string; until: string; order: 'ASC' | 'DESC'; limit: number };

type BoundaryEventsQueryParams = { changeEventType: string; boundary: { time: string; adGroupId: string }; limit: number };

type PlanEventsQueryParams = { changeEventType: string; state: CreateEventState; now: Date; limit: number };
