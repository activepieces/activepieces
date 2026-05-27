import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { spreadIfNotUndefined } from '@activepieces/shared';
import { gorgiasAuth } from '../../';
import { gorgiasApi } from '../common/client';
import { gorgiasCustomer, GorgiasCustomer } from '../common/customer';

export const updateCustomer = createAction({
  auth: gorgiasAuth,
  name: 'update_customer',
  displayName: 'Update Customer',
  description: 'Update the details of an existing customer.',
  props: {
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description:
        'The numeric ID of the customer to update. Use the "Find Customer" action to look it up by email.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Leave empty to keep the current name.',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Leave empty to keep the current external ID.',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'ISO 639-1 code (e.g. "en"). Leave empty to keep the current value.',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA timezone name. Leave empty to keep the current value.',
      required: false,
    }),
  },
  async run(context) {
    const { customer_id, name, external_id, language, timezone } = context.propsValue;

    const response = await gorgiasApi.call<GorgiasCustomer>({
      auth: context.auth.props,
      method: HttpMethod.PUT,
      path: `/customers/${customer_id}`,
      body: {
        ...spreadIfNotUndefined('name', name),
        ...spreadIfNotUndefined('external_id', external_id),
        ...spreadIfNotUndefined('language', language),
        ...spreadIfNotUndefined('timezone', timezone),
      },
    });

    return gorgiasCustomer.flattenCustomer(response.body);
  },
});
