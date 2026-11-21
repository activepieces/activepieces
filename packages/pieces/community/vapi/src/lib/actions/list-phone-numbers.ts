import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { vapiUtils } from '../common/vapi-api';
import { vapiResources } from '../common/props';
import { vapiOutputSchemas } from '../common/output-schemas';

export const listPhoneNumbers = createAction({
  auth: vapiAuth,
  name: 'list_phone_numbers',
  classification: 'SEARCH',
  displayName: 'List Phone Numbers',
  description: 'List the phone numbers in your Vapi organization, newest first.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.listPhoneNumbers,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of phone numbers to return (1-1000). Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const items = await vapiResources.list({
      apiKey: context.auth.secret_text,
      path: '/phone-number',
      operation: 'list phone numbers',
      limit: vapiUtils.clampLimit({ value: context.propsValue.limit, defaultValue: 100, max: 1000 }),
    });
    return { phoneNumbers: items };
  },
});
