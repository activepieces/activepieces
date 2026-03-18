import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon } from '../common';
import { lobstermailAuth } from '../..';

export const listEmails = createAction({
  auth: lobstermailAuth,
  name: 'list_emails',
  displayName: 'List Emails',
  description: 'List emails in a specific inbox',
  props: {
    inbox_id: Property.ShortText({
      displayName: 'Inbox ID',
      description: 'The inbox ID to fetch emails from (e.g. ibx_...)',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Max results to return (default 20)',
      required: false,
    }),
  },
  async run(context) {
    const { inbox_id, limit } = context.propsValue;
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${lobstermailCommon.baseUrl}/v1/inboxes/${inbox_id}/emails${qs ? `?${qs}` : ''}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body;
  },
});
