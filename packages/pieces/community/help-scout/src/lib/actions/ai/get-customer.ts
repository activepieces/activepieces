import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const getCustomer = createAction({
  auth: helpScoutAuth,
  name: 'get_customer',
  classification: 'READ',
  displayName: 'Get Customer',
  description: 'Gets one customer by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches one Help Scout customer by numeric ID with profile fields plus emails, phones, social profiles and address. Use after Find Customer or a conversation primaryCustomer.id. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: helpScoutOutputSchemas['customer'],
  props: {
    customerId: Property.Number({ displayName: 'Customer ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await helpScoutApi.request({
      method: HttpMethod.GET,
      path: `/customers/${helpScoutApi.encodeId(propsValue.customerId)}`,
      auth,
    });
    return helpScoutApi.isRecord(response.body) ? helpScoutApi.stripLinks(response.body) : {};
  },
});
