import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findConversation = createAction({
  auth: helpScoutAuth,
  name: 'findConversation',
  displayName: 'Find Conversation',
  description: 'Locate a conversation by subject, mailbox, tags, or customer.',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Search for conversations with this subject.',
      required: false,
    }),
    mailboxId: Property.Number({
      displayName: 'Mailbox ID',
      description: 'Filter by mailbox ID.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Filter by tags (comma separated).',
      required: false,
      properties: {
        tag: Property.ShortText({
          displayName: 'Tag',
          required: true,
        }),
      },
    }),
    customerId: Property.Number({
      displayName: 'Customer ID',
      description: 'Filter by customer ID.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Conversation status',
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
    }),
  },
  async run({ auth, propsValue }) {
    const params: string[] = [];
    if (propsValue['subject']) {
      params.push(`query=(subject:\"${encodeURIComponent(propsValue['subject'])}\")`);
    }
    if (propsValue['mailboxId']) {
      params.push(`mailbox=${propsValue['mailboxId']}`);
    }
    if (propsValue['tags'] && propsValue['tags'].length > 0) {
      const tagList = propsValue['tags'].map((t: any) => t.tag).join(',');
      params.push(`tag=${encodeURIComponent(tagList)}`);
    }
    if (propsValue['customerId']) {
      params.push(`query=(customerIds:${propsValue['customerId']})`);
    }
    if (propsValue['status']) {
      params.push(`status=${propsValue['status']}`);
    }
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    const response = await makeRequest(auth.access_token, HttpMethod.GET, `/conversations${queryString}`);
    return response;
  },
});
