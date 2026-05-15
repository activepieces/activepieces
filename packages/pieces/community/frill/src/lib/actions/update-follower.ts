import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { frillAuth } from '../../';
import { frillDropdowns, flattenObject } from '../common';

export const updateFollower = createAction({
  auth: frillAuth,
  name: 'update_follower',
  displayName: 'Update Follower',
  description: 'Update an existing user (follower), including custom attributes and company associations.',
  props: {
    follower: frillDropdowns.followerDropdown,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name for the follower. Leave empty to keep unchanged.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'New email address. Leave empty to keep unchanged.',
      required: false,
    }),
    attributes: Property.Object({
      displayName: 'Custom Attributes',
      description: 'Custom attributes to merge with existing ones (requires custom attributes feature).',
      required: false,
    }),
    companies: Property.Array({
      displayName: 'Companies',
      description: 'Companies to merge with existing associations. Each entry must include id and name.',
      required: false,
      properties: {
        id: Property.ShortText({ displayName: 'Company ID', required: true }),
        name: Property.ShortText({ displayName: 'Company Name', required: true }),
      },
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {};
    if (context.propsValue.name) body.name = context.propsValue.name;
    if (context.propsValue.email) body.email = context.propsValue.email;
    if (context.propsValue.attributes) body.attributes = context.propsValue.attributes;
    if (context.propsValue.companies && context.propsValue.companies.length > 0) {
      body.companies = context.propsValue.companies;
    }

    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.POST,
      url: `https://api.frill.co/v1/followers/${context.propsValue.follower}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      body,
    });

    return flattenObject(response.body);
  },
});
