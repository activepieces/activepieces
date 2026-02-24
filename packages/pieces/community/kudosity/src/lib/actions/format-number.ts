import { createAction, Property } from '@activepieces/pieces-framework';
import { kudosityAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const formatNumber = createAction({
  auth: kudosityAuth,
  name: 'formatNumber',
  displayName: 'Format Number',
  description: 'Format a phone number to international E.164 format',
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
