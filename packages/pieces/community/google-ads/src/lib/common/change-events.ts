import { createHash } from 'node:crypto';

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

export function planEventsQuery({ changeEventType, state, now, horizon, limit }: PlanEventsQueryParams): { state: CreateEventState; query: string } {
  const window = eventWindow(now);
  const boundary = state.boundary;
  if (boundary !== undefined && boundary.time >= window.start) {
    return { state, query: boundaryEventsQuery({ changeEventType, boundary, limit }) };
  }
  const current = boundary === undefined && state.scan !== undefined ? state : { ...restingState(state), horizon };
  const after = latest([current.floor, current.scan ?? current.floor, window.start]);
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

export function seenKey(id: string): string {
  return createHash('sha256').update(id).digest('base64url').slice(0, SEEN_KEY_LENGTH);
}

export function unpackKeys(packed: string): string[] {
  return Array.from({ length: Math.floor(packed.length / SEEN_KEY_LENGTH) }, (_, index) => packed.slice(index * SEEN_KEY_LENGTH, (index + 1) * SEEN_KEY_LENGTH));
}

export function eventWindow(now: Date): { start: string; end: string } {
  return {
    start: formatTime(new Date(now.getTime() - 29 * DAY_MS)).slice(0, 10),
    end: formatTime(new Date(now.getTime() + 2 * DAY_MS)).slice(0, 10),
  };
}

export function baselineState({ events, now, limit, enabledAt, timeZone }: BaselineStateParams): CreateEventState {
  const start = eventWindow(now).start;
  const oldest = events.reduce((min, event) => (event.time < min ? event.time : min), events[0]?.time ?? start);
  const floor = events.length >= limit ? latest([start, oldest]) : start;
  const tracked = track({ state: { floor, seen: [] }, events: [...events].sort((a, b) => compareEvents({ a, b })), horizon: undefined });
  return { ...finish({ tracked, position: undefined, horizon: undefined }), enabledAt, timeZone };
}

export function accountTime({ now, timeZone }: { now: Date; timeZone: string }): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((entry) => entry.type === type)?.value ?? '00';
  return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}:${part('second')}`;
}

export function clockHorizon({ now, timeZone }: { now: Date; timeZone: string }): string {
  return minusMinutes({ time: accountTime({ now, timeZone }), minutes: OVERLAP_MINUTES });
}

export function beforeActivation({ state, event }: { state: CreateEventState; event: CreateEvent }): boolean {
  return state.enabledAt !== undefined && event.time < state.enabledAt;
}

export function freshEvents({ state, events }: { state: CreateEventState; events: CreateEvent[] }): CreateEvent[] {
  const known = knownKeys(state);
  return events.filter((event) => !known.has(seenKey(event.id)));
}

export function absorbEvents({ state, events, full, horizon }: AbsorbParams): AbsorbResult {
  const boundary = state.boundary;
  const scope = boundary === undefined ? events : events.filter((event) => event.time === boundary.time);
  const tracked = track({ state, events: scope, horizon: state.horizon });
  const page = tracked.cut === undefined ? scope : scope.slice(0, tracked.cut.index);
  const fresh = freshEvents({ state, events: page });
  if (tracked.cut !== undefined && fresh.length === 0) {
    return { fresh, state: stalled({ state, release: tracked.cut.release, horizon }) };
  }
  const params = { state, tracked, events: page, full: full || tracked.cut !== undefined, replay: fresh.length === 0 };
  if (boundary === undefined) {
    return { fresh, state: absorbPage(params) };
  }
  return { fresh, ...absorbBoundary({ ...params, boundary }) };
}

function absorbPage({ state, tracked, events, full, replay }: PageParams): CreateEventState {
  if (!full || events.length === 0) {
    return finish({ tracked, position: undefined, horizon: state.horizon });
  }
  const last = events.reduce((max, event) => (compareEvents({ a: event, b: max }) > 0 ? event : max));
  const reached = events.filter((event) => event.time === last.time && event.adGroupId === last.adGroupId).map((event) => seenKey(event.id));
  return {
    ...finish({ tracked, position: last.time, horizon: state.horizon }),
    ...cycleOf(state),
    boundary: { time: last.time, adGroupId: last.adGroupId, ids: packKeys(reached), ...(replay ? { replay } : {}) },
  };
}

function absorbBoundary({ state, boundary, tracked, events, full, replay }: PageParams & { boundary: BoundaryCursor }): BoundaryResult {
  const settled = { ...finish({ tracked, position: boundary.time, horizon: state.horizon }), ...cycleOf(state) };
  if (!full || events.length === 0) {
    return { state: { ...settled, scan: boundary.time } };
  }
  const flag = boundary.replay === true && replay ? { replay } : {};
  const known = unpackKeys(boundary.ids);
  const returned = new Set(events.map((event) => seenKey(event.id)));
  const pending = known.filter((id) => !returned.has(id));
  const lastGroup = events.reduce((max, event) => (compareIds({ a: event.adGroupId, b: max }) > 0 ? event.adGroupId : max), boundary.adGroupId);
  if (lastGroup !== boundary.adGroupId) {
    const reached = events.filter((event) => event.adGroupId === lastGroup).map((event) => seenKey(event.id));
    return { state: { ...settled, boundary: { time: boundary.time, adGroupId: lastGroup, ids: packKeys([...pending, ...reached]), ...flag } } };
  }
  const ids = [...new Set([...known, ...returned])];
  if (ids.length > known.length && ids.length <= MAX_BOUNDARY_IDS) {
    return { state: { ...settled, boundary: { time: boundary.time, adGroupId: lastGroup, ids: packKeys(ids), ...flag } } };
  }
  const next = { ...settled, boundary: { time: boundary.time, adGroupId: nextId(lastGroup), ids: packKeys(pending), ...flag } };
  if (flag.replay === true) {
    return { state: next };
  }
  return { state: next, overflow: { time: boundary.time, adGroupId: lastGroup } };
}

function track({ state, events, horizon }: TrackParams): Tracked {
  const groups = new Map(state.seen.map((group) => [group.time, new Set(unpackKeys(group.ids))]));
  const boundaryKeys = new Set(unpackKeys(state.boundary?.ids ?? ''));
  let total = [...groups.values()].reduce((sum, ids) => sum + ids.size, 0);
  let floor = state.floor;
  let newest = [...groups.keys()].reduce<string | undefined>((max, time) => (max === undefined || time > max ? time : max), undefined);
  let closing = state.closing === true;
  const fits = (to: string): boolean => total < SEEN_CAP || total - evictable({ groups, before: secondOf(to) }) < SEEN_CAP;
  const raise = (to: string): void => {
    if (to <= floor) {
      return;
    }
    floor = to;
    for (const [time, ids] of groups) {
      if (time < secondOf(floor)) {
        total -= ids.size;
        groups.delete(time);
      }
    }
  };
  for (const [index, event] of events.entries()) {
    const second = secondOf(event.time);
    const key = seenKey(event.id);
    if (groups.get(second)?.has(key) === true || boundaryKeys.has(key)) {
      continue;
    }
    const reach = newest === undefined || second > newest ? second : newest;
    const base = latest([floor, minusMinutes({ time: reach, minutes: OVERLAP_MINUTES })]);
    const closed = horizon === undefined ? floor : latest([floor, earliest([horizon, second])]);
    if (fits(base) || fits(latest([base, closed]))) {
      raise(fits(base) ? base : latest([base, closed]));
      groups.set(second, (groups.get(second) ?? new Set<string>()).add(key));
      total += 1;
      newest = reach;
    } else if (horizon !== undefined && second < horizon) {
      raise(closed);
      closing = true;
    } else {
      return { floor, seen: packGroups(groups), closing, cut: { index, release: closed } };
    }
  }
  return { floor, seen: packGroups(groups), closing };
}

function finish({ tracked, position, horizon }: FinishParams): CreateEventState {
  const closes = tracked.closing && horizon !== undefined;
  const floor = closes ? latest([tracked.floor, position === undefined ? horizon : earliest([horizon, secondOf(position)])]) : tracked.floor;
  const seen = tracked.seen.filter((group) => group.time >= secondOf(floor));
  return { floor, seen, ...(closes && position !== undefined ? { closing: true } : {}) };
}

function stalled({ state, release, horizon }: { state: CreateEventState; release: string; horizon: string }): CreateEventState {
  if (state.horizon !== undefined && horizon <= state.horizon) {
    return state;
  }
  const floor = latest([state.floor, release]);
  return { ...restingState(state), floor, seen: state.seen.filter((group) => group.time >= secondOf(floor)) };
}

function restingState(state: CreateEventState): CreateEventState {
  return {
    floor: state.floor,
    seen: state.seen,
    ...(state.pending === undefined ? {} : { pending: state.pending }),
    ...(state.enabledAt === undefined ? {} : { enabledAt: state.enabledAt }),
    ...(state.timeZone === undefined ? {} : { timeZone: state.timeZone }),
  };
}

function cycleOf(state: CreateEventState): { horizon?: string } {
  return state.horizon === undefined ? {} : { horizon: state.horizon };
}

function knownKeys(state: CreateEventState): Set<string> {
  return new Set([...state.seen.flatMap((group) => unpackKeys(group.ids)), ...unpackKeys(state.boundary?.ids ?? '')]);
}

function evictable({ groups, before }: { groups: Map<string, Set<string>>; before: string }): number {
  let count = 0;
  for (const [time, ids] of groups) {
    if (time < before) {
      count += ids.size;
    }
  }
  return count;
}

function packKeys(keys: string[]): string {
  return [...new Set(keys)].join('');
}

function packGroups(groups: Map<string, Set<string>>): SeenGroup[] {
  return [...groups.entries()]
    .filter(([, ids]) => ids.size > 0)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([time, ids]) => ({ time, ids: [...ids].join('') }));
}

function secondOf(time: string): string {
  return time.slice(0, 19);
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

function earliest(times: string[]): string {
  return times.reduce((min, time) => (time < min ? time : min));
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
const SEEN_KEY_LENGTH = 8;

export const OVERLAP_MINUTES = 10;
export const SEEN_CAP = 30_000;
export const EVENTS_PER_POLL = 10_000;
export const MAX_BOUNDARY_IDS = 15_000;

export type CreateEvent = { id: string; time: string; resourceName: string; adGroupId: string };

export type SeenGroup = { time: string; ids: string };

export type BoundaryCursor = { time: string; adGroupId: string; ids: string; replay?: boolean };

export type PendingRecord = { id: string; at: number };

export type CreateEventState = {
  floor: string;
  seen: SeenGroup[];
  boundary?: BoundaryCursor;
  scan?: string;
  horizon?: string;
  closing?: boolean;
  pending?: PendingRecord[];
  enabledAt?: string;
  timeZone?: string;
};

type BaselineStateParams = { events: CreateEvent[]; now: Date; limit: number; enabledAt: string; timeZone: string };

type AbsorbParams = { state: CreateEventState; events: CreateEvent[]; full: boolean; horizon: string };

type Tracked = { floor: string; seen: SeenGroup[]; closing: boolean; cut?: { index: number; release: string } };

type TrackParams = { state: CreateEventState; events: CreateEvent[]; horizon: string | undefined };

type FinishParams = { tracked: Tracked; position: string | undefined; horizon: string | undefined };

type PageParams = { state: CreateEventState; tracked: Tracked; events: CreateEvent[]; full: boolean; replay: boolean };

type BoundaryResult = { state: CreateEventState; overflow?: { time: string; adGroupId: string } };

type AbsorbResult = BoundaryResult & { fresh: CreateEvent[] };

type CreateEventsQueryParams = { changeEventType: string; after: string; until: string; order: 'ASC' | 'DESC'; limit: number };

type BoundaryEventsQueryParams = { changeEventType: string; boundary: { time: string; adGroupId: string }; limit: number };

type PlanEventsQueryParams = { changeEventType: string; state: CreateEventState; now: Date; horizon: string; limit: number };
