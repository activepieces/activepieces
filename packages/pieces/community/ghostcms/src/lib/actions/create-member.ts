import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { ghostAuth } from '../..';
import { common } from '../common';

export const createMember = createAction({
  name: 'create_member',
  displayName: 'Create Member',
  description: 'Create a new member',
  auth: ghostAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Full Name',
      required: false,
    }),
    note: Property.ShortText({
      displayName: 'Note',
      required: false,
    }),
    newsletters: common.properties.newsletters(false),
  },

  async run(context) {
    const newsletters: any[] = [];
    if (context.propsValue.newsletters) {
      context.propsValue.newsletters.forEach((newsletter: any) => {
        newsletters.push({
          id: newsletter,
        });
      });
    }

    const response = await httpClient.sendRequest({
      url: `${context.auth.baseUrl}/ghost/api/admin/members`,
      method: HttpMethod.POST,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(context.auth.apiKey)}`,
      },
      body: {
        members: [
          {
            email: context.propsValue.email,
            name: context.propsValue.name,
            note: context.propsValue.note,
            newsletters: newsletters,
          },
        ],
      },
    });

    return response.body;
  },
});
