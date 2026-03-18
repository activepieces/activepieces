import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon } from '../common';
import { lobstermailAuth } from '../..';

export const searchEmails = createAction({
  auth: lobstermailAuth,
  name: 'search_emails',
  displayName: 'Search Emails',
  description:
    'Search emails across inboxes with full-text query and filters',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Full-text search query',
      required: true,
    }),
    inbox_id: Property.ShortText({
      displayName: 'Inbox ID',
      description: 'Limit search to a specific inbox (optional)',
      required: false,
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: 'Filter by email direction',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Inbound', value: 'inbound' },
          { label: 'Outbound', value: 'outbound' },
        ],
      },
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'Filter by sender address',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Max results (default 20)',
      required: false,
    }),
  },
  async run(context) {
    const { query, inbox_id, direction, from, limit } = context.propsValue;
    const params = new URLSearchParams();
    params.set('q', query);
    if (inbox_id) params.set('inboxId', inbox_id);
    if (direction) params.set('direction', direction);
    if (from) params.set('from', from);
    if (limit) params.set('limit', String(limit));

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${lobstermailCommon.baseUrl}/v1/emails/search?${params.toString()}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body;
  },
});
