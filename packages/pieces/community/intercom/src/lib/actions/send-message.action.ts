import {
  DynamicPropsValue,
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { intercomCommon } from '../common';
import { intercomAuth } from '../..';

enum MessageType {
  EMAIL = 'email',
  IN_APP = 'in_app',
}
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
          { value: MessageType.IN_APP, label: 'In App Chat' },
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
    from: Property.Dropdown({
      displayName: 'From (Admin)',
      options: async ({ auth }) => {
        if (!auth) {
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your account first',
          };
        }
        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
        const request = httpClient.sendRequest<{
          admins: { id: string; email: string; name: string }[];
        }>({
          method: HttpMethod.GET,
          url: `https://api.intercom.io/admins`,
          headers: intercomCommon.intercomHeaders,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
          },
        });
        const response = (await request).body;

        return {
          options: response.admins.map((c) => {
            const res = { value: c.id, label: '' };
            if (c.name) {
              res.label = c.name;
            } else if (c.email) {
              res.label = c.email;
            } else {
              res.label = c.id;
            }
            return res;
          }),
        };
      },
      refreshers: [],
      required: true,
    }),
    to: Property.Dropdown({
      displayName: 'To',
      options: async ({ auth }) => {
        if (!auth) {
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your account first',
          };
        }
        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
        const request = httpClient.sendRequest<{
          data: { id: string; email: string; name: string }[];
        }>({
          method: HttpMethod.GET,
          url: `https://api.intercom.io/contacts`,
          headers: intercomCommon.intercomHeaders,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
          },
        });
        const response = (await request).body;

        return {
          options: response.data.map((c) => {
            const res = { value: c.id, label: '' };
            if (c.name) {
              res.label = c.name;
            } else if (c.email) {
              res.label = c.email;
            } else {
              res.label = c.id;
            }
            return res;
          }),
        };
      },
      refreshers: [],
      required: true,
    }),
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
    const accessToken = context.auth.access_token;
    const user = await intercomCommon.getContact({
      userId: context.propsValue.to,
      token: accessToken,
    });
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.intercom.io/messages',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      headers: intercomCommon.intercomHeaders,
      body: {
        message_type: context.propsValue.message_type,
        from: {
          id: context.propsValue.from,
          role: 'admin',
        },
        to: {
          id: context.propsValue.to,
          role: user.role,
        },
        body: context.propsValue.body,
        template: context.propsValue.email_required_fields['template'],
        subject: context.propsValue.email_required_fields['subject'],
        create_conversation_without_contact_reply:
          context.propsValue.create_conversation_without_contact_reply,
      },
    });
    return response.body;
  },
});
