import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { addEventAuth } from '../auth';
import { addEventApi } from '../common/client';
import { addEventProps } from '../common/props';
import { AddEventEvent, AddEventPage } from '../common/types';

export const addEventFindOrCreateEventAction = createAction({
  auth: addEventAuth,
  name: 'find_or_create_event',
  displayName: 'Find or Create Event',
  description:
    'Searches for an event by a term. If no match is found, creates a new event with the details below.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches AddEvent events by a term and returns the first match; if none is found, creates a new event from the supplied details. Use when an agent wants an event to exist without risking a duplicate. Not strictly idempotent: the search term is not a guaranteed unique key, so concurrent or near-duplicate inputs can still create more than one event.',
    idempotent: false,
  },
  props: {
    search: Property.ShortText({
      displayName: 'Search Term',
      description:
        'Searches the title, internal name, description, and location of your events. The first match is returned.',
      required: true,
    }),
    ...addEventProps.eventFields({ mode: 'create' }),
  },
  async run(context) {
    const { search, ...createBody } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const response = await addEventApi.call<AddEventPage>({
      apiKey,
      method: HttpMethod.GET,
      resourceUri: '/events',
      query: {
        search,
        calendar_ids: createBody.calendar_id
          ? [createBody.calendar_id]
          : undefined,
        page_size: 1,
      },
    });
    const existing = response.events?.[0];
    if (existing) {
      return { found: true, created: false, event: existing };
    }

    const event = await addEventApi.call<AddEventEvent>({
      apiKey,
      method: HttpMethod.POST,
      resourceUri: '/events',
      body: createBody,
    });
    return { found: false, created: true, event };
  },
});
