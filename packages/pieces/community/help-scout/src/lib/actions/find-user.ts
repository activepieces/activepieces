import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { helpScoutOutputSchemas } from '../common/output-schemas';

export const findUser = createAction({
  auth: helpScoutAuth,
  name: 'find_user',
  classification: 'SEARCH',
  displayName: 'Find User',
  description: 'Finds a user by email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a Help Scout user (a teammate/agent, not a customer) by email and returns the first match with a found flag. Use to resolve a user ID for assignment or reply attribution; use List Users to browse instead. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: helpScoutOutputSchemas['findUser'],
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The teammate email address, for example agent@yourcompany.com.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const email = propsValue.email.trim();
    if (!email) {
      throw new Error('Provide the user email to search for.');
    }
    const response = await helpScoutApi.request({
      method: HttpMethod.GET,
      path: '/users',
      auth,
      queryParams: { email },
    });
    return helpScoutApi.findFirst({ body: response.body, key: 'users' });
  },
});
