import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurClient } from '../../common/client';
import type { ParseurRecord } from '../../common/types';
import { optionValuesOutputSchema } from '../../output-schemas';

export const getOptionValuesAction = createAction({
  auth: parseurAuth,
  name: 'parseur_get_option_values',
  outputSchema: optionValuesOutputSchema,
  displayName: 'Get Option Values',
  description: 'Lists the valid values for statuses, AI engines and other choices.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists every value Parseur accepts for its choice fields, each as a [value, label] pair: document statuses, AI engines, sort orders, field formats and more. Use it to pick valid values for List Documents, Create Mailbox or Update Mailbox.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await parseurClient.request<ParseurRecord>({
      auth,
      method: HttpMethod.GET,
      path: '/bootstrap',
    });
  },
});
