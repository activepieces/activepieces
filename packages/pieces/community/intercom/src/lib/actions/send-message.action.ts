import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { commonProps, intercomClient } from '../common';
import { intercomAuth } from '../..';
import { MessageType, RecipientType, Role } from 'intercom-client';

export const sendMessage = createAction({
  auth: intercomAuth,
  description: 'Send a message to a contact (only allowed by admins)',
  displayName: 'Send Message',
  name: 'send_message',
  props: {
    message_type: Property.StaticDropdown({
      displayName: 'Message Type',
      options: {
        options: [
          { value: MessageType.EMAIL, label: 'Email' },
          { value: MessageType.INAPP, label: 'In App Chat' },
        ],
      },
      required: true,
      defaultValue: MessageType.EMAIL,
    }),
    email_required_fields: Property.DynamicProperties({
      displayName: 'Email Required Fields',
      required: true,
      refreshers: ['message_type'],
      props: async ({ message_type }) => {
        let fields: DynamicPropsValue = {};
        if (
          (message_type as unknown as MessageType) === MessageType.EMAIL ||
          !message_type
        ) {
          fields = {
            subject: Property.ShortText({
              displayName: 'Subject',
              required: true,
              description: 'Email title',
            }),
            template: Property.StaticDropdown({
              displayName: 'Template',
              options: {
                options: [
                  { label: 'Personal', value: 'personal' },
                  { label: 'Plain', value: 'plain' },
                ],
              },
              required: true,
              defaultValue: 'personal',
              description: 'Style of the email',
            }),
          };
        }
        return fields;
      },
    }),
    from: commonProps.admins({ displayName: 'From (Admin)', required: true }),
    to: commonProps.contacts({ displayName: 'To', required: true }),
    body: Property.ShortText({
      displayName: 'Message Body',
      required: true,
    }),
    create_conversation_without_contact_reply: Property.Checkbox({
      displayName: 'Create Conversation Without Contact Reply',
      description:
        'Whether a conversation should be opened in the inbox for the message without the contact replying. Defaults to false if not provided.',
      required: false,
      defaultValue: false,
    }),
  },
  run: async (context) => {
    const client = intercomClient(context.auth);
    const user = await client.contacts.find({ id: context.propsValue.to });

    return await client.messages.create({
      messageType: context.propsValue.message_type,
      from: { id: context.propsValue.from, type: RecipientType.ADMIN },
      to: {
        id: context.propsValue.to,
        type: user.role === Role.USER ? RecipientType.USER : RecipientType.LEAD,
      },
      template: context.propsValue.email_required_fields['template'],
      subject: context.propsValue.email_required_fields['subject'],
      createConversationWithoutContactReply:
        context.propsValue.create_conversation_without_contact_reply,
      body: context.propsValue.body,
    });
  },
});
