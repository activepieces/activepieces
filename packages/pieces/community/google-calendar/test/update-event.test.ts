/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework';
import { calendar_v3 } from '@googleapis/calendar';

const getMock = vi.fn();
const updateMock = vi.fn();

vi.mock('@googleapis/calendar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@googleapis/calendar')>();
  return {
    ...actual,
    calendar: () => ({
      events: {
        get: getMock,
        update: updateMock,
      },
    }),
  };
});

vi.mock('../src/lib/auth', () => ({
  googleCalendarAuth: {},
  googleCalendarScopes: [],
  createGoogleClient: vi.fn().mockResolvedValue({}),
  getAccessToken: vi.fn().mockResolvedValue('an-access-token'),
}));

import { runUpdateEvent } from '../src/lib/actions/update-event.action';

type UpdateEventContext = Parameters<typeof runUpdateEvent>[0];

const timedEvent: calendar_v3.Schema$Event = {
  id: 'timed-event-id',
  status: 'confirmed',
  summary: 'Weekly Engineering Sync',
  description: 'Agenda in the doc.',
  location: 'Room 4',
  colorId: '5',
  start: { dateTime: '2026-09-14T10:00:00+03:00', timeZone: 'Asia/Amman' },
  end: { dateTime: '2026-09-14T11:00:00+03:00', timeZone: 'Asia/Amman' },
  recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO'],
  attendees: [
    { email: 'alice@example.com', responseStatus: 'accepted' },
    { email: 'bob@example.com', responseStatus: 'needsAction' },
  ],
  guestsCanModify: true,
  guestsCanInviteOthers: true,
  guestsCanSeeOtherGuests: true,
  transparency: 'transparent',
  visibility: 'private',
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'popup', minutes: 25 },
      { method: 'email', minutes: 120 },
    ],
  },
  extendedProperties: {
    private: { crmDealId: 'DEAL-8842' },
    shared: { teamTag: 'platform' },
  },
  attachments: [
    { fileUrl: 'https://drive.google.com/file/d/1abc/view', title: 'Notes.pdf', fileId: '1abc' },
  ],
  conferenceData: {
    conferenceId: 'abc-defg-hij',
    entryPoints: [{ entryPointType: 'video', uri: 'https://meet.google.com/abc-defg-hij' }],
  },
};

const allDayEvent: calendar_v3.Schema$Event = {
  id: 'all-day-event-id',
  summary: 'Company Offsite',
  start: { date: '2026-10-05' },
  end: { date: '2026-10-07' },
  recurrence: ['RRULE:FREQ=YEARLY'],
  reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 1440 }] },
};

const seriesInstance: calendar_v3.Schema$Event = {
  ...timedEvent,
  id: 'timed-event-id_20260921T070000Z',
  recurringEventId: 'timed-event-id',
  originalStartTime: { dateTime: '2026-09-21T10:00:00+03:00', timeZone: 'Asia/Amman' },
  recurrence: undefined,
};

const CHECKBOX_DEFAULTS = {
  guests_can_modify: false,
  guests_can_invite_others: false,
  guests_can_see_other_guests: false,
};

const AI_GUEST_PROPS_UNSET = {
  guests_can_modify: undefined,
  guests_can_invite_others: undefined,
  guests_can_see_other_guests: undefined,
};

function buildContext(propsValue: Record<string, unknown>): UpdateEventContext {
  return createMockActionContext({
    propsValue: {
      calendar_id: 'primary',
      eventId: 'timed-event-id',
      ...propsValue,
    },
  }) as unknown as UpdateEventContext;
}

async function updateWith({
  currentEvent,
  propsValue,
}: {
  currentEvent: calendar_v3.Schema$Event;
  propsValue: Record<string, unknown>;
}): Promise<calendar_v3.Schema$Event> {
  getMock.mockResolvedValue({ data: structuredClone(currentEvent) });
  updateMock.mockClear();
  updateMock.mockImplementation(async ({ requestBody }) => ({ data: requestBody }));
  await runUpdateEvent(buildContext(propsValue));
  return updateMock.mock.calls[0][0].requestBody;
}

beforeEach(() => {
  getMock.mockReset();
  updateMock.mockReset();
});

describe('runUpdateEvent request body', () => {
  test('a title-only update preserves every field the action does not expose', async () => {
    const body = await updateWith({
      currentEvent: timedEvent,
      propsValue: { title: 'Renamed', ...CHECKBOX_DEFAULTS },
    });

    expect(body.summary).toBe('Renamed');
    expect(body.recurrence).toEqual(['RRULE:FREQ=WEEKLY;BYDAY=MO']);
    expect(body.reminders).toEqual(timedEvent.reminders);
    expect(body.transparency).toBe('transparent');
    expect(body.visibility).toBe('private');
    expect(body.extendedProperties).toEqual(timedEvent.extendedProperties);
    expect(body.attachments).toEqual(timedEvent.attachments);
    expect(body.conferenceData).toEqual(timedEvent.conferenceData);
    expect(body.colorId).toBe('5');
    expect(body.attendees).toEqual(timedEvent.attendees);
  });

  test('an update with no fields set is a no-op on the stored event', async () => {
    const body = await updateWith({
      currentEvent: timedEvent,
      propsValue: { ...AI_GUEST_PROPS_UNSET },
    });

    expect(body).toEqual(timedEvent);
  });

  test('an unset optional prop contributes no key, so it cannot clear the field', async () => {
    const body = await updateWith({
      currentEvent: timedEvent,
      propsValue: { title: 'Renamed', ...AI_GUEST_PROPS_UNSET },
    });

    expect('colorId' in body).toBe(true);
    expect(body.colorId).toBe('5');
    expect(Object.values(body).every((value) => value !== undefined)).toBe(true);
  });

  test('an explicitly supplied colorId is applied', async () => {
    const body = await updateWith({
      currentEvent: timedEvent,
      propsValue: { colorId: '11', ...CHECKBOX_DEFAULTS },
    });

    expect(body.colorId).toBe('11');
    expect(body.recurrence).toEqual(['RRULE:FREQ=WEEKLY;BYDAY=MO']);
  });

  test('a reschedule keeps the timezone the event was pinned to', async () => {
    const body = await updateWith({
      currentEvent: timedEvent,
      propsValue: {
        start_date_time: '2026-09-14T14:00:00+03:00',
        end_date_time: '2026-09-14T15:00:00+03:00',
        ...CHECKBOX_DEFAULTS,
      },
    });

    expect(body.start?.timeZone).toBe('Asia/Amman');
    expect(body.end?.timeZone).toBe('Asia/Amman');
    expect(body.recurrence).toEqual(['RRULE:FREQ=WEEKLY;BYDAY=MO']);
  });

  test('setting only the start leaves the end untouched', async () => {
    const body = await updateWith({
      currentEvent: timedEvent,
      propsValue: { start_date_time: '2026-09-14T16:00:00+03:00', ...AI_GUEST_PROPS_UNSET },
    });

    expect(body.end).toEqual(timedEvent.end);
  });

  test('an all-day event stays all-day', async () => {
    const body = await updateWith({
      currentEvent: allDayEvent,
      propsValue: { title: 'Company Offsite 2026', ...CHECKBOX_DEFAULTS },
    });

    expect(body.start).toEqual({ date: '2026-10-05' });
    expect(body.end).toEqual({ date: '2026-10-07' });
    expect(body.start?.dateTime).toBeUndefined();
    expect(body.recurrence).toEqual(['RRULE:FREQ=YEARLY']);
  });

  test('updating one occurrence keeps its link back to the series', async () => {
    const body = await updateWith({
      currentEvent: seriesInstance,
      propsValue: { title: 'This week only', ...CHECKBOX_DEFAULTS },
    });

    expect(body.recurringEventId).toBe('timed-event-id');
    expect(body.originalStartTime).toEqual(seriesInstance.originalStartTime);
  });

  test('supplied attendees replace the list, and an empty list keeps it', async () => {
    const replaced = await updateWith({
      currentEvent: timedEvent,
      propsValue: { attendees: ['carol@example.com'], ...CHECKBOX_DEFAULTS },
    });
    expect(replaced.attendees).toEqual([{ email: 'carol@example.com' }]);

    const kept = await updateWith({
      currentEvent: timedEvent,
      propsValue: { attendees: [], ...CHECKBOX_DEFAULTS },
    });
    expect(kept.attendees).toEqual(timedEvent.attendees);
  });

  test('guest permissions left empty in the builder are kept', async () => {
    const body = await updateWith({
      currentEvent: timedEvent,
      propsValue: {
        title: 'Renamed',
        guests_can_modify: null,
        guests_can_invite_others: null,
        guests_can_see_other_guests: null,
      },
    });
    expect(body.guestsCanModify).toBe(true);
    expect(body.guestsCanInviteOthers).toBe(true);
    expect(body.guestsCanSeeOtherGuests).toBe(true);
  });

  test('guest permissions are kept when unset and applied when given', async () => {
    const unset = await updateWith({
      currentEvent: timedEvent,
      propsValue: { title: 'Renamed by agent', ...AI_GUEST_PROPS_UNSET },
    });
    expect(unset.guestsCanModify).toBe(true);
    expect(unset.guestsCanInviteOthers).toBe(true);
    expect(unset.guestsCanSeeOtherGuests).toBe(true);

    const given = await updateWith({
      currentEvent: timedEvent,
      propsValue: { ...AI_GUEST_PROPS_UNSET, guests_can_modify: false },
    });
    expect(given.guestsCanModify).toBe(false);
    expect(given.guestsCanInviteOthers).toBe(true);
  });
});
