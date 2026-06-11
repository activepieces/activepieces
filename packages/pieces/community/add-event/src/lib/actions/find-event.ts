import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { addEventAuth } from '../auth';
import { addEventApi } from '../common/client';
import { addEventProps } from '../common/props';
import { AddEventPage } from '../common/types';

export const addEventFindEventAction = createAction({
  auth: addEventAuth,
  name: 'find_event',
  displayName: 'Find Event',
  description:
    'Finds events matching a search term. Returns up to 20 of the best matches.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches AddEvent events by a required search term matched against title, internal name, description, and location, returning up to 20 matches. Use when an agent needs to look up existing events; optionally narrow by calendar and by an earliest/latest start datetime. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({
      displayName: 'Search Term',
      description:
        'Searches the title, internal name, description, and location of your events.',
      required: true,
    }),
    calendar_id: addEventProps.calendarId({ required: false }),
    datetime_min: Property.ShortText({
      displayName: 'Earliest Start',
      description:
        "Only return events starting on or after this time. Format: 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DD'.",
      required: false,
    }),
    datetime_max: Property.ShortText({
      displayName: 'Latest Start',
      description:
        "Only return events starting on or before this time. Format: 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DD'.",
      required: false,
    }),
  },
  async run(context) {
    const { search, calendar_id, datetime_min, datetime_max } =
      context.propsValue;
    const response = await addEventApi.call<AddEventPage>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/events',
      query: {
        search,
        calendar_ids: calendar_id ? [calendar_id] : undefined,
        datetime_min,
        datetime_max,
        page_size: addEventApi.maxPageSize,
        sort_by: 'datetime_start',
        sort_order: 'desc',
      },
    });
    const events = response.events ?? [];
    return {
      found: events.length > 0,
      events,
    };
  },
});
