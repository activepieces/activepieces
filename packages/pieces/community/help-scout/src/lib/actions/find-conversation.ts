import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../common/auth';

export const findConversation = createAction({
  name: 'find_conversation',
  displayName: 'Find Conversation',
  description: 'Locate a conversation by subject, mailbox, tags, or customer.',
  auth: helpScoutAuth,
  props: {
    subject: Property.ShortText({
      displayName: 'Subject (optional)',
      required: false,
    }),
    mailboxId: Property.Number({
      displayName: 'Mailbox ID (optional)',
      required: false,
    }),
    tag: Property.ShortText({
      displayName: 'Tag (optional)',
      required: false,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email (optional)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'All', value: 'all' },
          { label: 'Closed', value: 'closed' },
          { label: 'Open', value: 'open' },
          { label: 'Pending', value: 'pending' },
          { label: 'Spam', value: 'spam' },
        ],
      },
      defaultValue: 'active',
    }),
  },
  async run({ auth, propsValue }) {
    const params: Record<string, any> = {};
    if (propsValue['subject']) params['query'] = `(subject:\"${propsValue['subject']}\")`;
    if (propsValue['mailboxId']) params['mailbox'] = propsValue['mailboxId'];
    if (propsValue['tag']) params['tag'] = propsValue['tag'];
    if (propsValue['customerEmail']) params['query'] = (params['query'] ? params['query'] + ' AND ' : '') + `(email:\"${propsValue['customerEmail']}\")`;
    if (propsValue['status']) params['status'] = propsValue['status'];
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.helpscout.net/v2/conversations',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      queryParams: params,
    });
    return response.body;
  },
}); 