import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wavixAuth } from '../common/auth';
import { wavixApiCall } from '../common/client';

export const lookupNumber = createAction({
  auth: wavixAuth,
  name: 'lookup_number',
  classification: 'READ',
  displayName: 'Look Up Phone Number',
  description:
    'Validate and enrich a phone number (format, metadata, or a live network/HLR lookup).',
  audience: 'both',
  aiMetadata: {
    description:
      'Validates a phone number and returns metadata such as validity, country, number type, carrier and ported status. The type sets depth: "format" (syntax only), "analysis" (metadata, no network) or "validation" (live network/HLR lookup, which is billable).',
    idempotent: true,
  },
  props: {
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Number to validate, in E.164 format (leading + optional).',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Depth',
      description:
        'How deep to validate. "validation" performs a live network lookup and is billable.',
      required: true,
      defaultValue: 'analysis',
      options: {
        options: [
          { label: 'Format — syntax only', value: 'format' },
          { label: 'Analysis — metadata (type, country)', value: 'analysis' },
          { label: 'Validation — live network / HLR (billable)', value: 'validation' },
        ],
      },
    }),
  },
  async run(context) {
    const { phoneNumber, type } = context.propsValue;

    return await wavixApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourcePath: '/v1/validation',
      query: {
        phone_number: phoneNumber,
        type,
      },
    });
  },
});
