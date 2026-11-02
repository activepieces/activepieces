import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const aiUpdateCustomerProperties = createAction({
  auth: helpScoutAuth,
  name: 'ai_update_customer_properties',
  classification: 'WRITE',
  displayName: 'Update Customer Properties (by ID)',
  description: 'Sets custom property values on a customer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets values of custom customer properties (account-defined fields, not name or email) on one Help Scout customer. Keys are property slugs from List Customer Properties; dropdown properties take the option label, dates use YYYY-MM-DD. Only the given slugs change. Idempotent: repeating with the same values leaves the same state.',
    idempotent: true,
  },
  outputSchema: helpScoutOutputSchemas['updateCustomerProperties'],
  props: {
    customerId: Property.Number({ displayName: 'Customer ID', required: true }),
    properties: Property.Json({
      displayName: 'Properties',
      description: 'Object of property slug to value, for example {"plan": "Pro", "seats": 12}.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const properties = propsValue.properties;
    if (!helpScoutApi.isRecord(properties)) {
      throw new Error('Properties must be a JSON object of property slug to value.');
    }
    const updates = Object.entries(properties)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([slug, value]) => ({ op: 'replace', path: `/${slug}`, value }));
    if (updates.length === 0) {
      throw new Error('Provide at least one property value to update.');
    }
    await helpScoutApi.request({
      method: HttpMethod.PATCH,
      path: `/customers/${helpScoutApi.encodeId(propsValue.customerId)}/properties`,
      auth,
      body: updates,
    });
    return { success: true, customerId: String(propsValue.customerId), updated: updates.map((u) => u.path.slice(1)) };
  },
});
