import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { ghostAuth } from '../auth';
import { common } from '../common';
import { ghostOriginalMembersOutputSchema } from '../output-schemas';

export const updateMember = createAction({
  name: 'update_member',
  outputSchema: ghostOriginalMembersOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Member',
  description: 'Update a member',
  audience: 'human',
  aiMetadata: { description: 'Updates an existing Ghost member identified by member id, changing any supplied fields (email, name, note, newsletter subscriptions); omitted fields are left unchanged. Use to edit a known member. Requires the target member id. Idempotent: re-applying the same field values yields the same member state.', idempotent: true },
  auth: ghostAuth,
  propertyGroups: [
    {
      key: 'member',
      display: 'section',
      label: 'Member',
      icon: 'user',
      props: ['member'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'text',
      props: ['changes_info', 'email', 'name', 'note', 'newsletters'],
    },
  ],
  props: {
    member: common.properties.member(),
    changes_info: Property.MarkDown({
      value:
        'Empty fields keep their current value; Newsletters replaces the list.',
      variant: MarkdownVariant.INFO,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      width: 'half',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Full Name',
      width: 'half',
      required: false,
    }),
    note: Property.ShortText({
      displayName: 'Note',
      description: 'Private note, visible only to staff.',
      required: false,
    }),
    newsletters: common.properties.newsletters({
      required: false,
      description: "Replaces the member's current newsletters.",
    }),
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
      data.newsletters = newsletters;

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
