import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApiRequest } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailboxIdDropdown, userIdDropdown } from '../common/props';

export const findConversation = createAction({
  auth: helpScoutAuth,
  name: 'find_conversation',
  displayName: 'Find Conversation',
  description: 'Finds an existing conversation using provided filter.',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      required: false,
    }),
    mailboxId: mailboxIdDropdown(false),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
          { label: 'Pending', value: 'pending' },
          { label: 'Spam', value: 'spam' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
    assignTo: userIdDropdown('Assigned User'),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
    }),
    query: Property.ShortText({
      displayName: 'Custom Query',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (
      !propsValue.query &&
      !propsValue.mailboxId &&
      !propsValue.status &&
      !propsValue.tags &&
      !propsValue.assignTo &&
      !propsValue.subject &&
      !propsValue.email
    ) {
      throw new Error('At least one search parameter must be provided.');
    }
    if (propsValue.tags) {
      const uniqueTags = new Set(propsValue.tags);
      if (uniqueTags.size !== propsValue.tags.length) {
        throw new Error('Tags must be unique.');
      }
    }

    const query = [];

    if (propsValue.subject) query.push(`subject:"${propsValue.subject}"`);
    if (propsValue.email) query.push(`email:"${propsValue.email}"`);
    if (propsValue.query) query.push(propsValue.query);

    const queryParams: Record<string, any> = {};

    if (propsValue.mailboxId) queryParams['mailbox'] = propsValue.mailboxId;
    if (propsValue.status) queryParams['status'] = propsValue.status;
    if (propsValue.tags) queryParams['tags'] = propsValue.tags.join(',');
    if (propsValue.assignTo) queryParams['assigned_to'] = propsValue.assignTo;

    if (query.length > 0) {
      queryParams['query'] = `(${query.join(' AND ')})`;
    }
    const response = await helpScoutApiRequest({
      method: HttpMethod.GET,
      url: '/conversations',
      auth,
      queryParams,
    });
    const { _embedded } = response.body as {
      _embedded: {
        conversations: { id: number; subject: string }[];
      };
    };

    return {
      found: _embedded.conversations.length > 0,
      data:
        _embedded.conversations.length > 0 ? _embedded.conversations[0] : {},
    };
  },
});
