import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../common/auth';

export const createConversation = createAction({
  name: 'create_conversation',
  displayName: 'Create Conversation',
  description: 'Start a new conversation with optional tags, fields, and auto-reply options.',
  auth: helpScoutAuth,
  props: {
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Chat', value: 'chat' },
          { label: 'Phone', value: 'phone' },
        ],
      },
      defaultValue: 'email',
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    mailboxId: Property.Number({
      displayName: 'Mailbox ID',
      required: true,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      required: true,
    }),
    customerId: Property.Number({
      displayName: 'Customer ID (optional)',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
      properties: {
        tag: Property.ShortText({ displayName: 'Tag', required: true })
      }
    }),
    threads: Property.Array({
      displayName: 'Threads',
      required: true,
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: true,
          options: {
            options: [
              { label: 'Customer', value: 'customer' },
              { label: 'Note', value: 'note' },
              { label: 'Message', value: 'message' },
              { label: 'Chat', value: 'chat' },
              { label: 'Phone', value: 'phone' },
            ],
          },
          defaultValue: 'customer',
        }),
        body: Property.LongText({
          displayName: 'Body',
          required: true,
        }),
      },
    }),
    autoReply: Property.Checkbox({
      displayName: 'Auto Reply',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const customer: any = { email: propsValue['customerEmail'] };
    if (propsValue['customerId']) customer.id = propsValue['customerId'];
    const tags = (propsValue['tags'] || []).map((t: any) => t.tag);
    const threads = (propsValue['threads'] || []).map((t: any) => ({ type: t.type, body: t.body }));
    const body: any = {
      type: propsValue['type'],
      subject: propsValue['subject'],
      mailboxId: propsValue['mailboxId'],
      customer,
      tags,
      threads,
    };
    const params: Record<string, any> = {};
    if (propsValue['autoReply']) params['autoReply'] = true;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.helpscout.net/v2/conversations',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body,
      queryParams: params,
    });
    return response.body;
  },
}); 