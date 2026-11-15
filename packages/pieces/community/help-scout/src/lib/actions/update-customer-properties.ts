import { createAction, isNil } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { customerIdDropdown, customerProperties } from '../common/props';
import { helpScoutOutputSchemas } from '../common/output-schemas';

export const updateCustomerProperties = createAction({
  auth: helpScoutAuth,
  name: 'update_customer_properties',
  classification: 'WRITE',
  displayName: 'Update Customer Properties',
  description: `Updates customer's properties.`,
  audience: 'human',
  outputSchema: helpScoutOutputSchemas['updateCustomerProperties'],
  props: {
    customerId: customerIdDropdown,
    fields: customerProperties,
  },
  async run({ auth, propsValue }) {
    const fields = propsValue.fields ?? {};
    const updates = Object.entries(fields)
      .filter(([, value]) => !isNil(value) && value !== '')
      .map(([slug, value]) => ({ op: 'replace', path: `/${slug}`, value }));
    if (updates.length === 0) {
      return { success: true, customerId: String(propsValue.customerId), updated: [] };
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
