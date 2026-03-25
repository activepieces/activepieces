import { createAction, Property } from '@activepieces/pieces-framework';
import { mailgunAuth } from '../auth';
import { createMailgunClient, MailgunListResponse } from '../common/client';

export const addListMemberAction = createAction({
  auth: mailgunAuth,
  name: 'add_list_member',
  displayName: 'Add List Member',
  description: 'Add a member to a Mailgun mailing list.',
  props: {
    listAddress: Property.ShortText({
      displayName: 'List Address',
      required: true,
    }),
    memberAddress: Property.ShortText({
      displayName: 'Member Address',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    subscribed: Property.Checkbox({
      displayName: 'Subscribed',
      required: false,
      defaultValue: true,
    }),
    upsert: Property.Checkbox({
      displayName: 'Upsert',
      required: false,
      defaultValue: true,
    }),
    vars: Property.Json({
      displayName: 'Variables',
      required: false,
    }),
  },
  async run(context) {
    const client = createMailgunClient(context.auth.props);
    const vars = context.propsValue.vars;
    return (await client.lists.members.createMember(context.propsValue.listAddress, {
      address: context.propsValue.memberAddress,
      name: context.propsValue.name,
      subscribed: context.propsValue.subscribed ? 'yes' : 'no',
      upsert: context.propsValue.upsert ? 'yes' : 'no',
      vars: vars && typeof vars === 'object' ? JSON.stringify(vars) : undefined,
    })) as unknown as MailgunListResponse;
  },
});
