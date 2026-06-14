import { createAction, Property } from '@activepieces/pieces-framework';
import { kudosityAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const formatNumber = createAction({
  auth: kudosityAuth,
  name: 'formatNumber',
  displayName: 'Format Number',
  description: 'Format a phone number to international E.164 format',
  audience: 'both',
  aiMetadata: {
    description:
      'Normalize a phone number into international E.164 format using a supplied country code or name to resolve the local number. Use to validate or standardize numbers before sending or storing them. Requires the country and the number; this is a pure lookup with no side effect and is safe to repeat.',
    idempotent: true,
  },
  props: {
    country: Property.ShortText({
      displayName: 'Country',
      description:
        'Country code or name (e.g., US, AU, NZ) to determine the number format',
      required: true,
    }),
    number: Property.ShortText({
      displayName: 'Number',
      description:
        'Phone number in local format (spaces, hyphens, and other characters will be removed)',
      required: true,
    }),
  },
  async run(context) {
    const payload = {
      country: context.propsValue.country,
      msisdn: context.propsValue.number,
    };

    const res = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/format-number.json',
      payload
    );

    return res;
  },
});
