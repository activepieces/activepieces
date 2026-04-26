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
    labels: common.properties.labels(false),
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

    const labels: { name: string }[] = [];
    if (context.propsValue.labels) {
      context.propsValue.labels.forEach((labelName: string) => {
        labels.push({ name: labelName });
      });
    }

    const response = await httpClient.sendRequest({
      url: `${context.auth.props.baseUrl}/ghost/api/admin/members`,
      method: HttpMethod.POST,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(context.auth.props.apiKey)}`,
      },
      body: {
        members: [
          {
            email: context.propsValue.email,
            name: context.propsValue.name,
            note: context.propsValue.note,
            labels: labels,
            newsletters: newsletters,
          },
        ],
      },
    });

    return response.body;
  },
});
