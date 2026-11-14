import { describe, expect, test } from 'vitest';
import {
  buildAttendeeNames,
  buildEventQuery,
  flattenEvent,
  flattenEventWebhook,
  flattenLink,
  readWebhookBody,
  unwrapEventWebhook,
  SavvyCalAttendee,
  SavvyCalEvent,
} from '../src/lib/common';

describe('buildEventQuery', () => {
  test('sends the real SavvyCal filters and asks for every state by default', () => {
    const { queryParams, keep } = buildEventQuery({});
    expect(queryParams).toEqual({ state: 'any', period: 'upcoming' });
    expect(keep).toBeUndefined();
  });

  test('turns a start window into a fixed period with day margins, then filters exactly', () => {
    const { queryParams, keep } = buildEventQuery({
      startAfter: '2026-11-14T10:00:00.000Z',
      startBefore: '2026-11-20T18:00:00.000Z',
    });
    expect(queryParams).toMatchObject({ period: 'fixed', from: '2026-11-13', until: '2026-11-21' });
    expect(queryParams).not.toHaveProperty('start_after');
    expect(keep?.(event({ start_at: '2026-11-14T09:59:00Z' }))).toBe(false);
    expect(keep?.(event({ start_at: '2026-11-14T10:00:00Z' }))).toBe(true);
    expect(keep?.(event({ start_at: '2026-11-20T18:01:00Z' }))).toBe(false);
  });

  test('leaves the open side of a one-sided window wide open', () => {
    expect(buildEventQuery({ startAfter: '2026-11-14T10:00:00.000Z' }).queryParams).toMatchObject({
      from: '2026-11-13',
      until: '2100-12-31',
    });
    expect(buildEventQuery({ startBefore: '2026-11-14T10:00:00.000Z' }).queryParams).toMatchObject({
      from: '2000-01-01',
      until: '2026-11-15',
    });
  });

  test('sends one state and one link to the API, and filters several on our side', () => {
    expect(buildEventQuery({ states: ['canceled'], linkIds: ['link_a'] }).queryParams).toMatchObject({
      state: 'canceled',
      link: 'link_a',
    });

    const { queryParams, keep } = buildEventQuery({ states: ['confirmed', 'canceled'], linkIds: ['link_a', 'link_b'] });
    expect(queryParams.state).toBe('any');
    expect(queryParams).not.toHaveProperty('link');
    expect(keep?.(event({ state: 'confirmed', link: link('link_b') }))).toBe(true);
    expect(keep?.(event({ state: 'declined', link: link('link_b') }))).toBe(false);
    expect(keep?.(event({ state: 'confirmed', link: link('link_c') }))).toBe(false);
  });

  test('passes search, attendance and sort order through', () => {
    expect(
      buildEventQuery({ period: 'past', search: ' jane@example.com ', includeEventsNotAttending: true, newestFirst: true }).queryParams,
    ).toEqual({ state: 'any', period: 'past', q: 'jane@example.com', attendance: 'any', direction: 'desc' });
  });
});

describe('flattenEvent', () => {
  test('uses the scheduler and exposes their answers, team, and every attendee', () => {
    const row = flattenEvent(
      event({
        scheduler: attendee({ email: 'jane@example.com', fields: [{ id: 'f1', label: 'Company', type: 'short_text', value: 'Example Inc.' }] }),
        attendees: [attendee({ email: 'host@example.com', is_organizer: true }), attendee({ email: 'jane@example.com' })],
        scope: { id: 'scope_1', name: 'Acme', slug: 'acme' },
        metadata: { source: 'flow' },
      }),
    );
    expect(row).toMatchObject({
      attendee_email: 'jane@example.com',
      attendee_answers: { Company: 'Example Inc.' },
      organizer_email: 'host@example.com',
      team_name: 'Acme',
      attendee_count: 1,
      metadata: { source: 'flow' },
    });
    expect(row['attendees']).toHaveLength(2);
  });
});

describe('New Event webhook payloads', () => {
  test('a plain event payload is read as the event', () => {
    const row = flatten({ type: 'event.created', payload: event({ id: 'event_1' }) });
    expect(row).toMatchObject({ event_type: 'event.created', id: 'event_1', previous_start_at: null });
  });

  test('event.changed is unwrapped and carries the previous times', () => {
    const row = flatten({
      type: 'event.changed',
      payload: {
        event: event({ id: 'event_1', start_at: '2026-11-20T10:00:00Z' }),
        previous_attributes: { start_at: '2026-11-19T10:00:00Z', end_at: '2026-11-19T10:30:00Z' },
      },
    });
    expect(row).toMatchObject({
      id: 'event_1',
      start_at: '2026-11-20T10:00:00Z',
      previous_start_at: '2026-11-19T10:00:00Z',
      previous_end_at: '2026-11-19T10:30:00Z',
      previous_state: null,
    });
  });

  test.each(['event.attendee.added', 'event.attendee.canceled'])('%s describes the affected attendee', (type) => {
    const row = flatten({
      type,
      payload: {
        attendee: attendee({ email: 'guest@example.com', display_name: 'Guest' }),
        event: event({ id: 'event_1', is_group_session: true, scheduler: null }),
      },
    });
    expect(row).toMatchObject({ id: 'event_1', attendee_email: 'guest@example.com', attendee_display_name: 'Guest' });
  });

  test('event.attendee.rescheduled uses the new booking and keeps the original one', () => {
    const row = flatten({
      type: 'event.attendee.rescheduled',
      payload: {
        original_event: event({ id: 'event_old', start_at: '2026-11-19T10:00:00Z', end_at: '2026-11-19T11:00:00Z' }),
        original_attendee: attendee({ email: 'guest@example.com' }),
        new_event: event({ id: 'event_new', start_at: '2026-11-21T10:00:00Z' }),
        new_attendee: attendee({ email: 'guest@example.com' }),
      },
    });
    expect(row).toMatchObject({
      id: 'event_new',
      start_at: '2026-11-21T10:00:00Z',
      attendee_email: 'guest@example.com',
      previous_event_id: 'event_old',
      previous_start_at: '2026-11-19T10:00:00Z',
      previous_end_at: '2026-11-19T11:00:00Z',
    });
  });

  test('a payload that is not an event is ignored', () => {
    expect(unwrapEventWebhook({ type: 'event.changed', payload: { previous_attributes: {} } })).toBeNull();
    expect(readWebhookBody('not json')).toBeNull();
  });
});

describe('buildAttendeeNames', () => {
  test('splits a full name the way SavvyCal does when first and last names are not given', () => {
    expect(buildAttendeeNames({ fullName: '  Jane  van der Berg ' })).toEqual({
      display_name: 'Jane  van der Berg',
      first_name: 'Jane',
      last_name: 'van der Berg',
    });
  });

  test('keeps the first and last names given, and builds the full name from them', () => {
    expect(buildAttendeeNames({ firstName: 'Jane', lastName: 'Doe' })).toEqual({
      display_name: 'Jane Doe',
      first_name: 'Jane',
      last_name: 'Doe',
    });
    expect(buildAttendeeNames({ fullName: 'Doe Jane', firstName: 'Jane', lastName: 'Doe' })).toEqual({
      display_name: 'Doe Jane',
      first_name: 'Jane',
      last_name: 'Doe',
    });
  });

  test('sends no last name for a one-word name, and nothing when every name is empty', () => {
    expect(buildAttendeeNames({ fullName: 'Jane' })).toEqual({ display_name: 'Jane', first_name: 'Jane' });
    expect(buildAttendeeNames({ fullName: ' ', firstName: '', lastName: null })).toBeNull();
  });
});

describe('flattenLink', () => {
  test('maps the real link fields', () => {
    expect(
      flattenLink({
        id: 'link_1',
        name: 'Intro',
        private_name: 'Sales intro',
        slug: 'intro',
        state: 'disabled',
        description: '',
        durations: [15, 30],
        default_duration: 30,
        increment: 15,
        scope: null,
      }),
    ).toMatchObject({
      state: 'disabled',
      active: false,
      duration_minutes: 30,
      available_durations_minutes: [15, 30],
      description: null,
      team_id: null,
    });
  });
});

function flatten({ type, payload }: { type: string; payload: unknown }): Record<string, unknown> {
  const unwrapped = unwrapEventWebhook({ type, payload });
  if (!unwrapped) throw new Error(`could not unwrap ${type}`);
  return flattenEventWebhook({ type, unwrapped });
}

function attendee(overrides: Partial<SavvyCalAttendee> = {}): SavvyCalAttendee {
  return {
    id: 'attendee_1',
    first_name: 'Jane',
    last_name: 'Doe',
    display_name: 'Jane Doe',
    email: 'jane@example.com',
    phone_number: null,
    time_zone: 'Europe/Paris',
    is_organizer: false,
    response_status: 'accepted',
    marketing_opt_in: false,
    fields: [],
    ...overrides,
  };
}

function link(id: string): SavvyCalEvent['link'] {
  return { id, name: 'Intro', slug: 'intro', private_name: null };
}

function event(overrides: Partial<SavvyCalEvent> = {}): SavvyCalEvent {
  return {
    id: 'event_1',
    uuid: 'uuid_1',
    summary: 'Intro',
    description: '',
    duration: 30,
    start_at: '2026-11-20T10:00:00Z',
    end_at: '2026-11-20T10:30:00Z',
    state: 'confirmed',
    url: 'https://savvycal.com/events/uuid_1',
    created_at: '2026-11-01T10:00:00Z',
    canceled_at: null,
    cancel_reason: null,
    rescheduled_at: null,
    reschedule_reason: null,
    original_start_at: null,
    original_end_at: null,
    is_group_session: false,
    location: null,
    attendees: [],
    conferencing: null,
    link: link('link_a'),
    payment: null,
    ...overrides,
  };
}
