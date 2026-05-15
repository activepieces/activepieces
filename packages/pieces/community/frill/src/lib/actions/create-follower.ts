import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { frillAuth } from '../../';
import { flattenObject } from '../common';

export const createFollower = createAction({
  auth: frillAuth,
  name: 'create_follower',
  displayName: 'Create Follower',
  description: 'Add a new user (follower) to Frill, optionally with custom attributes and company data.',
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
      description: 'Companies to associate with this follower. Each entry must include id and name.',
      required: false,
      properties: {
        id: Property.ShortText({ displayName: 'Company ID', required: true }),
        name: Property.ShortText({ displayName: 'Company Name', required: true }),
      },
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      name: context.propsValue.name,
      email: context.propsValue.email,
    };
    if (context.propsValue.attributes) {
      body.attributes = context.propsValue.attributes;
    }
    if (context.propsValue.companies && context.propsValue.companies.length > 0) {
      body.companies = context.propsValue.companies;
    }

    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.POST,
      url: 'https://api.frill.co/v1/followers',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      body,
    });

    return flattenObject(response.body);
  },
});
