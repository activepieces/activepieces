import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { helpScoutApi } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { mailboxIdDropdown, userIdDropdown } from '../common/props';
import { helpScoutOutputSchemas } from '../common/output-schemas';

export const findConversation = createAction({
  auth: helpScoutAuth,
  name: 'find_conversation',
  classification: 'SEARCH',
  displayName: 'Find Conversation',
  description: 'Finds an existing conversation using provided filter.',
  audience: 'human',
  outputSchema: helpScoutOutputSchemas['findConversation'],
  props: {
    subject: Property.ShortText({ displayName: 'Subject', required: false }),
    mailboxId: mailboxIdDropdown(false),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Leave empty to search every status.',
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
    email: Property.ShortText({ displayName: 'Email', required: false }),
    tags: Property.Array({ displayName: 'Tags', required: false }),
    query: Property.ShortText({ displayName: 'Custom Query', required: false }),
  },
  async run({ auth, propsValue }) {
    const tags = helpScoutApi.uniqueOrThrow({ values: helpScoutApi.toStringList(propsValue.tags), label: 'Tags' });
    if (
      !propsValue.query &&
      !propsValue.mailboxId &&
      !propsValue.status &&
      tags.length === 0 &&
      !propsValue.assignTo &&
      !propsValue.subject &&
      !propsValue.email
    ) {
      throw new Error('At least one search parameter must be provided.');
    }
    const query: string[] = [];
    if (propsValue.subject) query.push(`subject:"${helpScoutApi.escapeQueryValue(propsValue.subject)}"`);
    if (propsValue.email) query.push(`email:"${helpScoutApi.escapeQueryValue(propsValue.email)}"`);
    if (propsValue.query) query.push(propsValue.query);
    const queryParams: QueryParams = { status: propsValue.status || 'all' };
    if (propsValue.mailboxId) queryParams['mailbox'] = String(propsValue.mailboxId);
    if (tags.length > 0) queryParams['tag'] = tags.join(',');
    if (propsValue.assignTo) queryParams['assigned_to'] = String(propsValue.assignTo);
    if (query.length > 0) queryParams['query'] = `(${query.join(' AND ')})`;
    const response = await helpScoutApi.request({
      method: HttpMethod.GET,
      path: '/conversations',
      auth,
      queryParams,
    });
    return helpScoutApi.findFirst({ body: response.body, key: 'conversations' });
  },
});
