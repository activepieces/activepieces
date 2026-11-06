import { createAction } from '@activepieces/pieces-framework';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const listCustomerProperties = createAction({
  auth: helpScoutAuth,
  name: 'list_customer_properties',
  classification: 'READ',
  displayName: 'List Customer Properties',
  description: 'Lists the custom customer property definitions.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the custom customer property definitions of the Help Scout account: slug, name, type (text, number, url, date, dropdown) and dropdown options. Use to learn valid slugs and values before Update Customer Properties. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: helpScoutOutputSchemas['listCustomerProperties'],
  props: {},
  async run({ auth }) {
    const { items } = await helpScoutApi.fetchPaged({
      auth,
      path: '/customer-properties',
      embedKey: 'customer-properties',
      limit: 500,
    });
    const properties = items.map((item) => ({
      slug: item['slug'],
      name: item['name'],
      type: item['type'],
      options: Array.isArray(item['options']) ? item['options'] : [],
    }));
    return { properties, count: properties.length };
  },
});
