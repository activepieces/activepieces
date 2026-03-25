import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { campaignIdProp } from '../common/props';
import { cleanPayload, replyIoRequest } from '../common/client';

export const createAndPushToCampaignAction = createAction({
  name: 'create_and_push_to_campaign',
  displayName: 'Create and Push to Campaign',
  description: 'Create or update a contact and push it to a Reply.io campaign.',
  auth: replyIoAuth,
  props: {
    campaignId: campaignIdProp,
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await replyIoRequest({
      apiKey: auth.props.api_key,
      method: HttpMethod.POST,
      path: '/v1/actions/addandpushtocampaign',
      body: cleanPayload({
        campaignId: Number(propsValue.campaignId),
        email: propsValue.email,
        firstName: propsValue.firstName,
        lastName: propsValue.lastName,
        company: propsValue.company,
        city: propsValue.city,
        state: propsValue.state,
        country: propsValue.country,
        title: propsValue.title,
        phone: propsValue.phone,
      }),
    });

    return response.body;
  },
});
