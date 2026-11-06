import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { leexiAuth } from '../common/auth';
import { leexiApi } from '../common/client';
import { LeexiListResponse, LeexiMeetingEvent } from '../common/types';
import { leexiOutputFields } from '../common/constants';

function toIso(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date "${value}". Use an ISO 8601 date such as 2026-01-31T00:00:00.000Z.`);
  }
  return date.toISOString();
}

export const listMeetingEventsAction = createAction({
  name: 'list_meeting_events',
  classification: 'SEARCH',
  auth: leexiAuth,
  displayName: 'List Meeting Events',
  description: 'List scheduled Leexi meeting events (calendar, manual or API).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Leexi meeting events (scheduled meetings the Leexi assistant may record) with title, organizer, attendees, meeting URL, start/end time, origin and recording flags, plus pagination. Filter by a start_time or end_time window and by origin (calendar, manual, api). Requires the read_meeting_events scope on the API key. Read-only.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'data', label: 'Meeting Events', listItems: leexiOutputFields.meetingEvent, labelKey: 'title' },
      { key: 'pagination', label: 'Pagination', children: leexiOutputFields.pagination },
    ],
  },
  props: {
    from: Property.DateTime({
      displayName: 'From',
      description: 'Only events on or after this time (see Date Filter).',
      required: false,
    }),
    to: Property.DateTime({
      displayName: 'To',
      description: 'Only events on or before this time (see Date Filter).',
      required: false,
    }),
    date_filter: Property.StaticDropdown({
      displayName: 'Date Filter',
      description: 'Which event date From/To apply to. Defaults to start_time.',
      required: false,
      options: {
        options: [
          { label: 'Start Time', value: 'start_time' },
          { label: 'End Time', value: 'end_time' },
        ],
      },
    }),
    origin: Property.StaticDropdown({
      displayName: 'Origin',
      description: 'Only return events from this origin.',
      required: false,
      options: {
        options: [
          { label: 'Calendar', value: 'calendar' },
          { label: 'Manual', value: 'manual' },
          { label: 'API', value: 'api' },
        ],
      },
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      description: 'Sort order. Defaults to latest start time first.',
      required: false,
      options: {
        options: [
          { label: 'Start Time (latest first)', value: 'start_time desc' },
          { label: 'Start Time (earliest first)', value: 'start_time asc' },
          { label: 'End Time (latest first)', value: 'end_time desc' },
          { label: 'End Time (earliest first)', value: 'end_time asc' },
          { label: 'Created At (newest first)', value: 'created_at desc' },
          { label: 'Created At (oldest first)', value: 'created_at asc' },
        ],
      },
    }),
    items: Property.Number({
      displayName: 'Results per Page',
      description: 'Number of events per page, 1-100. Defaults to 20.',
      required: false,
      defaultValue: 20,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    return await leexiApi.request<LeexiListResponse<LeexiMeetingEvent>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: ['meeting_events'],
      query: {
        page: Math.max(1, Math.floor(p.page ?? 1)),
        items: Math.min(100, Math.max(1, Math.floor(p.items ?? 20))),
        order: p.order,
        origin: p.origin,
        date_filter: p.date_filter,
        from: toIso(p.from),
        to: toIso(p.to),
      },
    });
  },
});
