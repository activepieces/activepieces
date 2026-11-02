import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { eventTypeActionOutputSchema } from '../output-schemas';

export const calcomCreateEventType = createAction({
  auth: calcomAuth,
  name: 'calcom_create_event_type',
  classification: 'WRITE',
  displayName: 'Create Event Type',
  description: 'Create a new Cal.com event type.',
  audience: 'ai',
  outputSchema: eventTypeActionOutputSchema,
  aiMetadata: {
    description:
      'Creates a new bookable event type with a title, slug and length. Use Additional Fields for any of the many advanced Cal.com event-type settings not exposed directly here (e.g. booking limits, recurrence, locations) — it is merged into the same request. Not idempotent: each call creates a new event type, so retries duplicate.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description: 'URL-safe identifier for the event type, must be unique.',
      required: true,
    }),
    length_in_minutes: Property.Number({
      displayName: 'Length (Minutes)',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    schedule_id: Property.Number({
      displayName: 'Schedule ID',
      description: 'Assign a different availability schedule than the owner\'s default one. Get this from List Schedules.',
      required: false,
    }),
    hidden: Property.Checkbox({
      displayName: 'Hidden',
      required: false,
    }),
    additional_fields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Advanced event-type fields not listed above, as a JSON object matching the Cal.com v2 Create Event Type request body (e.g. {"bookingLimitsCount": {...}}).',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const {
      title,
      slug,
      length_in_minutes,
      description,
      schedule_id,
      hidden,
      additional_fields,
    } = propsValue;

    const body: Record<string, unknown> = {
      ...(additional_fields as Record<string, unknown> | undefined),
      title,
      slug,
      lengthInMinutes: length_in_minutes,
    };
    if (description !== undefined) body['description'] = description;
    if (schedule_id !== undefined) body['scheduleId'] = schedule_id;
    if (hidden !== undefined) body['hidden'] = hidden;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/event-types',
      version: calcomCommon.versions.eventTypes,
      body,
    });
  },
});
