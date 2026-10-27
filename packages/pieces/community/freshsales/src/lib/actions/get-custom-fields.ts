import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { customFieldsOutputSchema } from '../output-schemas';

export const getCustomFields = createAction({
  auth: freshsalesAuth,
  name: 'get_custom_fields',
  displayName: 'Get Fields',
  description: 'List the fields (incl. custom cf_ fields) of a record type',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists the fields of Freshsales contacts, accounts, deals or sales activities with API name, label, type, required flag and choices. Use it to learn custom field API names (cf_...) and allowed values before passing Custom Fields to create or update tools.',
    idempotent: true,
  },
  outputSchema: customFieldsOutputSchema,
  props: {
    entity: Property.StaticDropdown({
      displayName: 'Record Type',
      description: 'Which record type to describe',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Contacts', value: 'contacts' },
          { label: 'Accounts', value: 'sales_accounts' },
          { label: 'Deals', value: 'deals' },
          { label: 'Sales Activities', value: 'sales_activities' },
        ],
      },
    }),
  },
  async run(context) {
    const entity = context.propsValue.entity;
    if (!['contacts', 'sales_accounts', 'deals', 'sales_activities'].includes(entity)) {
      throw new Error(`Unsupported Record Type "${entity}".`);
    }
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/settings/${entity}/fields`,
    });
    const fields = freshsalesClient
      .readArray({ body: response, key: 'fields' })
      .filter((item) => freshsalesClient.isRecord(item))
      .map((field) => ({
        name: field['name'],
        label: field['label'],
        type: field['type'],
        required: field['required'] === true,
        is_custom: typeof field['name'] === 'string' && field['name'].startsWith('cf_'),
        choices: Array.isArray(field['choices']) ? field['choices'] : [],
      }));
    return { fields };
  },
});
