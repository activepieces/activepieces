import { createAction, Property } from '@activepieces/pieces-framework';
import { posthogAuth } from '../auth';
import { captureEvent } from '../common/capture';
import { posthogClient } from '../common/client';
import { posthogOutputSchemas } from '../common/output-schemas';

export const posthogCreateEvent = createAction({
  auth: posthogAuth,
  name: 'create_event',
  classification: 'WRITE',
  displayName: 'Capture Event',
  description: 'Capture a custom event in PostHog',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a custom analytics event to PostHog for a user identified by distinct_id (the same ID your app uses, e.g. user ID or email), with optional event properties (keys starting with $set update the person). Returns the event uuid and timestamp. Ingestion is asynchronous: the event shows up in queries after a few seconds. Each call records a new event unless you pass the same uuid and timestamp again, which PostHog deduplicates.',
    idempotent: false,
  },
  outputSchema: posthogOutputSchemas.captured,
  props: {
    event: Property.ShortText({
      displayName: 'Event Name',
      description: 'The name of the event to capture',
      required: true,
    }),
    distinct_id: Property.ShortText({
      displayName: 'Distinct ID',
      description: 'Unique identifier for the user performing the action (e.g. user ID or email address)',
      required: true,
    }),
    properties: Property.Object({
      displayName: 'Properties',
      description: 'Additional event properties as key/value pairs',
      required: false,
    }),
    timestamp: Property.DateTime({
      displayName: 'Timestamp',
      description: 'When the event happened (ISO 8601). Defaults to now.',
      required: false,
    }),
    uuid: Property.ShortText({
      displayName: 'Event UUID',
      description: 'Reuse with the same timestamp to avoid duplicate events.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return captureEvent({
      auth: auth.props,
      event: posthogClient.requiredText({ value: propsValue.event, label: 'Event Name' }),
      distinctId: posthogClient.requiredText({ value: propsValue.distinct_id, label: 'Distinct ID' }),
      properties: posthogClient.plainObject({ value: propsValue.properties, label: 'Properties' }),
      timestamp: posthogClient.isoTimestamp({ value: propsValue.timestamp, label: 'Timestamp' }),
      uuid: posthogClient.uuid({ value: propsValue.uuid, label: 'Event UUID' }),
    });
  },
});
