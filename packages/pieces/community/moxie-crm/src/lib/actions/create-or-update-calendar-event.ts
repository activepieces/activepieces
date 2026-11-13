import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieFields } from '../common/fields';
import { moxieInput, moxieProps, moxieBody } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieCreateOrUpdateCalendarEventAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_create_or_update_calendar_event',
  classification: 'WRITE',
  displayName: 'Create or Update Calendar Event',
  description: 'Create a Moxie calendar event, or update one by id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a Moxie calendar event when Event ID is empty (Start Time and End Time required), or updates the event with that id; when updating, pass every field the event should keep. Use to block time or mirror meetings from another calendar. Not idempotent in create mode: each call without an Event ID creates another event.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.calendarEvent,
  props: {
    eventId: Property.ShortText({
      displayName: 'Event ID',
      description: 'Id of an existing event to update. Leave empty to create a new event.',
      required: false,
    }),
    startTime: Property.ShortText({
      displayName: 'Start Time',
      description: 'ISO 8601 start, for example 2026-10-01T09:00:00Z. Required when creating.',
      required: false,
    }),
    endTime: Property.ShortText({
      displayName: 'End Time',
      description: 'ISO 8601 end, after the start. Required when creating.',
      required: false,
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.calendarEvent, audience: 'ai' }),
  },
  async run({ auth, propsValue }) {
    const eventId = moxieInput.optionalId({ value: propsValue.eventId, field: 'Event ID' });
    const startTime = moxieInput.dateTime({ value: propsValue.startTime, field: 'Start Time' });
    const endTime = moxieInput.dateTime({ value: propsValue.endTime, field: 'End Time' });
    if (eventId === undefined && (startTime === undefined || endTime === undefined)) {
      throw new Error('Start Time and End Time are required to create an event.');
    }
    if (startTime !== undefined && endTime !== undefined && Date.parse(endTime) <= Date.parse(startTime)) {
      throw new Error('End Time must be after Start Time.');
    }
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.POST,
      path: '/action/calendar/createOrUpdate',
      body: {
        ...moxieInput.compact({ values: { eventId, startTime, endTime } }),
        ...moxieBody.fromSpecs({ specs: moxieFields.calendarEvent, values: propsValue }),
      },
      notFoundMessage:
        eventId === undefined
          ? 'Moxie could not find the owner. Owner Email must belong to a workspace user.'
          : `No calendar event with id ${eventId} in this Moxie workspace.`,
    });
  },
});
