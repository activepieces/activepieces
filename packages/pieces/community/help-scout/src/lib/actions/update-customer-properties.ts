import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { customerIdDropdown } from '../common/props';

export const updateCustomerProperties = createAction({
  auth: helpScoutAuth,
  name: 'updateCustomerProperties',
  displayName: 'Update Customer Properties',
  description: '',
  props: {
    customerId: customerIdDropdown,
    operations: Property.Array({
      displayName: 'Operations',
      description: 'List of patch operations (add, remove, replace)',
      required: true,
      properties: {
        op: Property.StaticDropdown({
          displayName: 'Operation',
          required: true,
          options: {
            options: [
              { label: 'Add', value: 'add' },
              { label: 'Remove', value: 'remove' },
              { label: 'Replace', value: 'replace' },
            ],
          },
        }),
        path: Property.ShortText({
          displayName: 'Path',
          description: 'Field path (e.g., /firstName, /emails)',
          required: true,
        }),
        value: Property.Json({
          displayName: 'Value',
          description: 'Value for add/replace (not required for remove)',
          required: false,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const customerId = propsValue['customerId'];
    const operations = propsValue['operations'];
    if (!Array.isArray(operations)) {
      throw new Error('Operations are required and must be an array.');
    }
    // Remove value if op is 'remove' (not needed)
    const patchOps = operations.map((op: any) => {
      if (op.op === 'remove') {
        return { op: op.op, path: op.path };
      }
      return op;
    });
    await makeRequest(auth.access_token, HttpMethod.PATCH, `/customers/${customerId}`, patchOps);
    return { success: true, message: 'Customer updated' };
  },
});
