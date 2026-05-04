import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { engagebayAuth } from '../auth';
import { engagebayRequest } from '../common/client';

export const getContactsAction = createAction({
  auth: engagebayAuth,
  name: 'get_contacts',
  displayName: 'Get Contacts',
  description: 'Get a list of contacts from EngageBay.',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination.',
      required: false,
      defaultValue: 0,
    }),
    size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of contacts per page.',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { page, size } = context.propsValue;

    return await engagebayRequest({
      apiKey: context.auth,
      path: '/api/panel/users/contacts',
      queryParams: {
        page: String(page ?? 0),
        size: String(size ?? 20),
      },
    });
  },
});
