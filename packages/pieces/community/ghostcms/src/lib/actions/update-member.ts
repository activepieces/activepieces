import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { ghostAuth } from '../..';
import { common } from '../common';

export const updateMember = createAction({
  name: 'update_member',
  displayName: 'Update Member',
  description: 'Update a member',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing Ghost member identified by member id, changing any supplied fields (email, name, note, newsletter subscriptions); omitted fields are left unchanged. Use to edit a known member. Requires the target member id. Idempotent: re-applying the same field values yields the same member state.', idempotent: true },
  auth: ghostAuth,
  props: {
    member: common.properties.member(),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
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

    const data: {
      email?: string;
      name?: string;
      note?: string;
      newsletters?: any[];
    } = {};

    if (context.propsValue.email) data.email = context.propsValue.email;
    if (context.propsValue.name) data.name = context.propsValue.name;
    if (context.propsValue.note) data.note = context.propsValue.note;
    if (context.propsValue.newsletters)
      data.newsletters = context.propsValue.newsletters;

    const response = await httpClient.sendRequest({
      url: `${context.auth.props.baseUrl}/ghost/api/admin/members/${context.propsValue.member}`,
      method: HttpMethod.PUT,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(context.auth.props.apiKey)}`,
      },
      body: {
        members: [data],
      },
    });

    return response.body;
  },
});
