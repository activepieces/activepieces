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
