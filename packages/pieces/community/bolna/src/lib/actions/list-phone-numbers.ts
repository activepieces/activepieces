import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bolnaaiAuth } from '../common/auth';
import { bolnaClient } from '../common/client';
import { bolnaSchemas } from '../common/schemas';

export const listPhoneNumbers = createAction({
  auth: bolnaaiAuth,
  name: 'list_phone_numbers',
  displayName: 'List Phone Numbers',
  description: 'List the phone numbers owned in the Bolna account.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: {
    fields: [
      {
        key: 'phone_numbers',
        label: 'Phone Numbers',
        labelKey: 'phone_number',
        listItems: [
          { key: 'id', label: 'ID' },
          { key: 'phone_number', label: 'Phone Number' },
          { key: 'agent_id', label: 'Agent ID' },
          { key: 'telephony_provider', label: 'Telephony Provider' },
          { key: 'rented', label: 'Rented', format: 'boolean' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
          { key: 'renewal_at', label: 'Renewal At', format: 'datetime' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  aiMetadata: {
    description:
      "Lists the phone numbers in the Bolna account with the agent each one is linked to. Use a number from here as the from-number in Make Phone Call. An empty list means calls go out from Bolna's default number.",
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await bolnaClient.makeRequest<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/phone-numbers/all',
    });
    const phoneNumbers = bolnaSchemas
      .asArray(response)
      .map((item) =>
        bolnaSchemas.pick({
          source: item,
          keys: [
            'id',
            'phone_number',
            'agent_id',
            'telephony_provider',
            'rented',
            'created_at',
            'renewal_at',
          ],
        })
      );
    return { phone_numbers: phoneNumbers, count: phoneNumbers.length };
  },
});
