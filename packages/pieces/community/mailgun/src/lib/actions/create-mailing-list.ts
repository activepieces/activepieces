import { createAction, Property } from '@activepieces/pieces-framework';
import { mailgunAuth } from '../auth';
import { createMailgunClient, MailgunListResponse } from '../common/client';

export const createMailingListAction = createAction({
  auth: mailgunAuth,
  name: 'create_mailing_list',
  displayName: 'Create Mailing List',
  description: 'Create a Mailgun mailing list.',
  props: {
    address: Property.ShortText({
      displayName: 'List Address',
      description: 'Full mailing list address, for example announcements@example.com.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    accessLevel: Property.StaticDropdown({
      displayName: 'Access Level',
      required: false,
      defaultValue: 'readonly',
      options: {
        options: [
          { label: 'Read Only', value: 'readonly' },
          { label: 'Members', value: 'members' },
          { label: 'Everyone', value: 'everyone' },
        ],
      },
    }),
    replyPreference: Property.StaticDropdown({
      displayName: 'Reply Preference',
      required: false,
      defaultValue: 'list',
      options: {
        options: [
          { label: 'List', value: 'list' },
          { label: 'Sender', value: 'sender' },
        ],
      },
    }),
  },
  async run(context) {
    const client = createMailgunClient(context.auth.props);
    return (await client.lists.create({
      address: context.propsValue.address,
      name: context.propsValue.name,
      description: context.propsValue.description,
      access_level: context.propsValue.accessLevel as 'readonly' | 'members' | 'everyone' | undefined,
      reply_preference: context.propsValue.replyPreference as 'list' | 'sender' | undefined,
    })) as unknown as MailgunListResponse;
  },
});
