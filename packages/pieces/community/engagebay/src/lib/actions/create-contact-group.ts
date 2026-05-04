import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { engagebayAuth } from '../auth';
import { engagebayRequest } from '../common/client';

export const createContactGroupAction = createAction({
  auth: engagebayAuth,
  name: 'create_contact_group',
  displayName: 'Create Contact Group',
  description: 'Create a new contact group in EngageBay.',
  props: {
    name: Property.ShortText({
      displayName: 'Group Name',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    return await engagebayRequest({
      apiKey: context.auth,
      method: HttpMethod.POST,
      path: '/api/core/groups',
      body: { name },
    });
  },
});
