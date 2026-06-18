import { createAction } from '@activepieces/pieces-framework';
import { helpScoutApiRequest } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { customerIdDropdown, customerProperties } from '../common/props';
import { isNil } from '@activepieces/shared';
import { HttpStatusCode } from 'axios';

export const updateCustomerProperties = createAction({
  auth: helpScoutAuth,
  name: 'update_customer_properties',
  displayName: 'Update Customer Properties',
  description: `Updates customer's properties.`,
  audience: 'both',
  aiMetadata: {
    description:
      "Updates a Help Scout customer's editable property fields (the supplied fields are replaced) for the customer identified by customer ID. Use to modify an existing customer's attributes; only non-empty fields are applied. Repeating the call with the same values is safe and converges to the same state.",
    idempotent: true,
  },
  props: {
    customerId: customerIdDropdown,
    fields: customerProperties,
  },
  async run({ auth, propsValue }) {
    const { customerId } = propsValue;
    const fields = propsValue.fields ?? {};

    const updates = [];

    for (const [key, value] of Object.entries(fields)) {
      if (isNil(value) || value === '') continue;

      updates.push({ op: 'replace', value: value, path: `/${key}` });
    }

    const response = await helpScoutApiRequest({
      method: HttpMethod.PATCH,
      url: `/customers/${customerId}/properties`,
      auth,
      body: updates,
    });

    return {
      success: response.status === HttpStatusCode.NoContent ? true : false,
    };
  },
});
