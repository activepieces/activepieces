import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { frillAuth } from '../auth';
import { frillDropdowns, flattenObject, frillApiCall } from '../common';

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
      description: 'Companies to merge with this follower\'s existing associations. Find company IDs in your Frill dashboard under Settings > Companies.',
      required: false,
      properties: {
        id: Property.ShortText({ displayName: 'Company ID', description: 'The unique identifier for the company in Frill (found in the company URL or via the API).', required: true }),
        name: Property.ShortText({ displayName: 'Company Name', description: 'The display name for the company.', required: true }),
      },
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {};
    if (context.propsValue.name) body['name'] = context.propsValue.name;
    if (context.propsValue.email) body['email'] = context.propsValue.email;
    if (context.propsValue.attributes) body['attributes'] = context.propsValue.attributes;
    if (context.propsValue.companies && context.propsValue.companies.length > 0) {
      body['companies'] = context.propsValue.companies;
    }

    const response = await frillApiCall<{ data: Record<string, unknown> }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/followers/${context.propsValue.follower}`,
      body,
    });

    return flattenObject(response.body.data);
  },
});
