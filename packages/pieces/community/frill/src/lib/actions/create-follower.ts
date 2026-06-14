import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { frillAuth } from '../auth';
import { flattenObject, frillApiCall } from '../common';

export const createFollower = createAction({
  auth: frillAuth,
  name: 'create_follower',
  displayName: 'Create Follower',
  description: 'Add a new user (follower) to Frill, optionally with custom attributes and company data.',
  audience: 'both',
  aiMetadata: { description: 'Adds a new follower (end user) to Frill by name and email, optionally with custom attributes and associated companies (each company needs an id and name). Use to register a user so they can be linked to feedback. Not idempotent: each call creates a follower, so use Update Follower to change an existing one.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name of the follower.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the follower.',
      required: true,
    }),
    attributes: Property.Object({
      displayName: 'Custom Attributes',
      description: 'Optional custom attributes as key-value pairs (requires custom attributes feature).',
      required: false,
    }),
    companies: Property.Array({
      displayName: 'Companies',
      description: 'Companies to associate with this follower. Find company IDs in your Frill dashboard under Settings > Companies.',
      required: false,
      properties: {
        id: Property.ShortText({ displayName: 'Company ID', description: 'The unique identifier for the company in Frill (found in the company URL or via the API).', required: true }),
        name: Property.ShortText({ displayName: 'Company Name', description: 'The display name for the company.', required: true }),
      },
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      name: context.propsValue.name,
      email: context.propsValue.email,
    };
    if (context.propsValue.attributes) {
      body['attributes'] = context.propsValue.attributes;
    }
    if (context.propsValue.companies && context.propsValue.companies.length > 0) {
      body['companies'] = context.propsValue.companies;
    }

    const response = await frillApiCall<{ data: Record<string, unknown> }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/followers',
      body,
    });

    return flattenObject(response.body.data);
  },
});
