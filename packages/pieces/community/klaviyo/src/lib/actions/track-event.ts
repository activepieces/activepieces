import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { isRecord, klaviyoApi } from '../common/client';
import { klaviyoInputs } from '../common/ai-props';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const trackEvent = createAction({
  auth: klaviyoAuth,
  name: 'track_event',
  classification: 'WRITE',
  displayName: 'Track Event',
  description: 'Record an event (such as "Placed Order") for a profile. The profile is created if it does not exist. Events can trigger Klaviyo flows unless Backfill is Yes. Klaviyo accepts events for reserved test domains such as example.com but never records them.',
  audience: 'both',
  aiMetadata: {
    description: 'Records a custom event (metric) for a person in Klaviyo, identified by email, phone number, external ID or profile ID; the profile is created if none matches. Events can start Klaviyo flows that send messages unless backfill is "yes". Klaviyo processes it asynchronously, so it appears in List Events after a short delay. Klaviyo accepts events for reserved test domains such as example.com but never records them. Not idempotent unless the same Unique ID is reused, which Klaviyo dedupes per profile and metric.',
    idempotent: false,
  },
  outputSchema: klaviyoOutputSchemas.trackEvent,
  props: {
    metric_name: Property.ShortText({
      displayName: 'Event Name',
      description: 'The metric name, for example "Placed Order". A new metric is created the first time a name is used.',
      required: true,
    }),
    email: Property.ShortText({ displayName: 'Email', description: 'Email of the person. Provide at least one identifier.', required: false }),
    phone_number: Property.ShortText({ displayName: 'Phone Number', description: 'Phone number in E.164 format (e.g. +15005550006).', required: false }),
    external_id: Property.ShortText({ displayName: 'External ID', required: false }),
    profile_id: Property.ShortText({ displayName: 'Profile ID', description: 'Klaviyo profile ID. Find it with Find Profile by Email/Phone or List Profiles.', required: false }),
    properties: Property.Object({
      displayName: 'Event Properties',
      description: 'Key-value details of the event (up to 400 keys), for example order ID and items.',
      required: false,
    }),
    value: Property.Number({ displayName: 'Value', description: 'A numeric value for the event, such as an order total.', required: false }),
    value_currency: Property.ShortText({ displayName: 'Value Currency', description: 'ISO 4217 currency code of the value, e.g. USD.', required: false }),
    unique_id: Property.ShortText({
      displayName: 'Unique ID',
      description: 'Optional ID for this event. Klaviyo ignores a second event with the same Unique ID for the same profile and metric, which makes retries safe.',
      required: false,
    }),
    time: Property.ShortText({
      displayName: 'Time',
      description: 'When the event happened, as an ISO 8601 date-time with timezone (e.g. 2026-01-15T10:00:00Z). Leave empty for now.',
      required: false,
    }),
    backfill: klaviyoInputs.yesNoProp({
      displayName: 'Backfill',
      description: 'Yes records the event without triggering flows (use for historical data). Leave empty for no.',
    }),
  },
  async run({ auth, propsValue }) {
    const metricName = klaviyoInputs.requireText({ value: propsValue.metric_name, label: 'Event Name' });
    const profileId = klaviyoInputs.optionalText(propsValue.profile_id);
    const profileAttributes: Record<string, string> = {};
    for (const field of IDENTIFIERS) {
      const text = klaviyoInputs.optionalText(propsValue[field]);
      if (text !== undefined) {
        profileAttributes[field] = text;
      }
    }
    if (profileId === undefined && Object.keys(profileAttributes).length === 0) {
      throw new Error('Provide at least one of Email, Phone Number, External ID or Profile ID.');
    }
    const time = klaviyoInputs.isoDateTime({ value: propsValue.time, label: 'Time' });
    const uniqueId = klaviyoInputs.optionalText(propsValue.unique_id);
    const valueCurrency = klaviyoInputs.optionalText(propsValue.value_currency);
    const backfill = klaviyoInputs.yesNo({ value: propsValue.backfill, label: 'Backfill' });
    const rawValue = propsValue.value;
    if (rawValue !== undefined && rawValue !== null && !Number.isFinite(Number(rawValue))) {
      throw new Error('Value must be a number.');
    }
    const attributes: Record<string, unknown> = {
      properties: isRecord(propsValue.properties) ? propsValue.properties : {},
      metric: { data: { type: 'metric', attributes: { name: metricName } } },
      profile: {
        data: {
          type: 'profile',
          ...(profileId === undefined ? {} : { id: profileId }),
          attributes: profileAttributes,
        },
      },
    };
    if (time !== undefined) {
      attributes['time'] = time;
    }
    if (rawValue !== undefined && rawValue !== null) {
      attributes['value'] = Number(rawValue);
    }
    if (valueCurrency !== undefined) {
      attributes['value_currency'] = valueCurrency;
    }
    if (uniqueId !== undefined) {
      attributes['unique_id'] = uniqueId;
    }
    if (backfill === true) {
      attributes['backfill'] = true;
    }
    await klaviyoApi.send({
      auth,
      method: HttpMethod.POST,
      path: '/events',
      body: { data: { type: 'event', attributes } },
    });
    return { accepted: true, metric_name: metricName, unique_id: uniqueId ?? null };
  },
});

const IDENTIFIERS: ('email' | 'phone_number' | 'external_id')[] = ['email', 'phone_number', 'external_id'];
