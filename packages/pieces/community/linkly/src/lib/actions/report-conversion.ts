import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { linklyAuth } from '../auth';
import { compact, linklyApiCall } from '../common/client';

export const reportConversion = createAction({
  auth: linklyAuth,
  name: 'report_conversion',
  displayName: 'Report Conversion',
  description: 'Record a purchase, signup or custom event so Linkly attributes it to the link that was clicked.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reports a conversion (sale, lead or custom event) to Linkly. Pass the linkly_cid captured from the landing page URL to attribute it to a specific click and link; pass external_id to tie later events to the same customer. event_id acts as an idempotency key, so re-sending the same event_id does not double count.',
    idempotent: true,
  },
  props: {
    event_name: Property.ShortText({
      displayName: 'Event name',
      description: 'What happened, e.g. purchase, signup, trial_started.',
      required: true,
    }),
    event_type: Property.StaticDropdown({
      displayName: 'Event type',
      required: false,
      defaultValue: 'custom',
      options: {
        disabled: false,
        options: [
          { label: 'Sale (records revenue)', value: 'sale' },
          { label: 'Lead (identifies the customer)', value: 'lead' },
          { label: 'Custom', value: 'custom' },
        ],
      },
    }),
    linkly_cid: Property.ShortText({
      displayName: 'Linkly click ID (linkly_cid)',
      description: 'The attribution token from the landing page URL. Leave empty if unavailable.',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Your identifier for the customer, sent on every event.',
      required: false,
    }),
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description: 'Your identifier for this event. Re-sending the same ID will not create a duplicate.',
      required: false,
    }),
    amount_cents: Property.Number({
      displayName: 'Amount (minor units)',
      description: 'e.g. 4999 for $49.99. Negative values record a refund.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'ISO 4217 code, defaults to USD.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter ISO code of the customer.',
      required: false,
    }),
    occurred_at: Property.DateTime({
      displayName: 'Occurred at',
      description: 'Defaults to now.',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Arbitrary JSON stored with the conversion (up to 10 KB).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return linklyApiCall({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/conversions',
      body: compact({ ...propsValue }),
    });
  },
});
