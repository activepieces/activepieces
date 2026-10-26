import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { eventTypeActionOutputSchema } from '../output-schemas';

function toOptionalBoolean(value: string | undefined): boolean | undefined {
  return value === undefined ? undefined : value === 'true';
}

export const calcomUpdateEventType = createAction({
  auth: calcomAuth,
  name: 'calcom_update_event_type',
  classification: 'WRITE',
  displayName: 'Update Event Type',
  description: 'Update an existing Cal.com event type. Only the fields you set are changed.',
  audience: 'ai',
  outputSchema: eventTypeActionOutputSchema,
  aiMetadata: {
    description:
      'Partially updates an event type by id: an omitted field keeps its current value. Get the id from List Event Types. Use Additional Fields for any of the many advanced Cal.com event-type settings not exposed directly here (e.g. booking limits, recurrence, locations) — it is merged into the same request. To clear Title/Description, pass a single space; Cal.com silently ignores a true empty string. Idempotent: repeating with the same input yields the same final state.',
    idempotent: true,
  },
  props: {
    event_type_id: Property.Number({
      displayName: 'Event Type ID',
      description: 'Get this from List Event Types.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    length_in_minutes: Property.Number({
      displayName: 'Length (Minutes)',
      required: false,
    }),
    schedule_id: Property.Number({
      displayName: 'Schedule ID',
      description: 'Assign a different availability schedule than the owner\'s default one. Get this from List Schedules.',
      required: false,
    }),
    hidden: Property.StaticDropdown({
      displayName: 'Hidden',
      description: 'Leave unset to keep the current visibility.',
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    additional_fields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Advanced event-type fields not listed above, as a JSON object matching the Cal.com v2 Update Event Type request body (e.g. {"bookingLimitsCount": {...}}).',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const {
      event_type_id,
      title,
      slug,
      description,
      length_in_minutes,
      schedule_id,
      hidden,
      additional_fields,
    } = propsValue;

    const body: Record<string, unknown> = {
      ...(additional_fields as Record<string, unknown> | undefined),
    };
    if (title !== undefined) body['title'] = title;
    if (slug !== undefined) body['slug'] = slug;
    if (description !== undefined) body['description'] = description;
    if (length_in_minutes !== undefined) body['lengthInMinutes'] = length_in_minutes;
    if (schedule_id !== undefined) body['scheduleId'] = schedule_id;
    const hiddenValue = toOptionalBoolean(hidden);
    if (hiddenValue !== undefined) body['hidden'] = hiddenValue;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.PATCH,
      path: `/event-types/${event_type_id}`,
      version: calcomCommon.versions.eventTypes,
      body,
    });
  },
});
