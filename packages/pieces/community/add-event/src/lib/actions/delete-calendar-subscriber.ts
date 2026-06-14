import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { addEventAuth } from '../auth';
import { addEventApi } from '../common/client';
import { addEventProps } from '../common/props';

export const addEventDeleteCalendarSubscriberAction = createAction({
  auth: addEventAuth,
  name: 'delete_calendar_subscriber',
  displayName: 'Delete Calendar Subscriber',
  description: 'Deletes a subscriber from your AddEvent calendar.',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes a subscriber from an AddEvent calendar, identified by subscriber ID. Use when an agent needs to unsubscribe someone from a calendar. Requires a valid subscriber ID; idempotent, since once removed, repeating the call leaves the subscriber absent.',
    idempotent: true,
  },
  props: {
    calendar_id: addEventProps.calendarId({ required: false }),
    subscriber_id: addEventProps.subscriberId({ required: true }),
  },
  async run(context) {
    const { subscriber_id } = context.propsValue;
    await addEventApi.call({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      resourceUri: `/subscribers/${subscriber_id}`,
    });
    return { success: true, id: subscriber_id };
  },
});
