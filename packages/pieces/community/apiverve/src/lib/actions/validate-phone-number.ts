import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { apiverveAuth } from '../auth';
import { apiverveCommon } from '../common';

export const validatePhoneNumberAction = createAction({
  auth: apiverveAuth,
  name: 'validate_phone_number',
  classification: 'READ',
  displayName: 'Validate Phone Number',
  description:
    'Check whether a phone number is valid and get it back in standard formats with its country and line type.',
  audience: 'both',
  aiMetadata: {
    description:
      'Validate and normalize one phone number, returning its formats, country and line type. Give the country code when the number has no international prefix. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to check, for example +1 415 555 2671.',
      required: true,
    }),
    country: Property.ShortText({
      displayName: 'Country Code',
      description:
        'Two-letter country code, for example US or GB. Needed when the number has no + prefix.',
      required: false,
    }),
  },
  async run(context) {
    return apiverveCommon.callApiverve({
      apiKey: context.auth.secret_text,
      path: '/v1/phonenumbervalidator',
      method: HttpMethod.GET,
      query: apiverveCommon.toQuery({
        number: context.propsValue.number,
        country: context.propsValue.country,
      }),
    });
  },
});
