import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gorgiasAuth } from '../../';
import { gorgiasApi } from '../common/client';
import { gorgiasCustomer, GorgiasCustomer } from '../common/customer';

export const createCustomer = createAction({
  auth: gorgiasAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Create a new customer in your Gorgias account.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The primary email address of the customer.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The full name of the customer.',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'An ID from an external system (e.g. your store or CRM) to link this customer to.',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'The preferred language as an ISO 639-1 code (e.g. "en", "fr").',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'An IANA timezone name (e.g. "America/New_York"). Defaults to UTC.',
      required: false,
    }),
  },
  async run(context) {
    const { email, name, external_id, language, timezone } = context.propsValue;

    const response = await gorgiasApi.call<GorgiasCustomer>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/customers',
      body: {
        name,
        external_id,
        language,
        timezone,
        channels: [{ type: 'email', address: email, preferred: true }],
      },
    });

    return gorgiasCustomer.flattenCustomer(response.body);
  },
});
