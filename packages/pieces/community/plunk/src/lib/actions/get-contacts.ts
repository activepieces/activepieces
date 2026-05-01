import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { plunkAuth, PLUNK_BASE_URL } from '../../index';

type PlunkContactsPage = {
  items?: unknown[];
  nextCursor?: string | null;
  hasMore?: boolean;
};

// Plunk's GET /v1/contacts is cursor-paginated. We page through with the
// max page size and accumulate items until `hasMore` is false. The page-cap
// guards against an unbounded loop if the API ever returns hasMore=true
// without advancing the cursor.
const MAX_PAGES = 200;

export const getContacts = createAction({
  auth: plunkAuth,
  name: 'get_all_contacts',
  displayName: 'Get All Contacts',
  description: 'Retrieve every contact in your Plunk project.',
  props: {},
  async run(context) {
    const items: unknown[] = [];
    let cursor: string | undefined;

    for (let page = 0; page < MAX_PAGES; page++) {
      const queryParams: Record<string, string> = { limit: '100' };
      if (cursor) queryParams['cursor'] = cursor;

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${PLUNK_BASE_URL}/contacts`,
        queryParams,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.props.secretKey,
        },
      });

      const body = response.body as PlunkContactsPage;
      if (body.items?.length) {
        items.push(...body.items);
      }

      if (!body.hasMore || !body.nextCursor) {
        break;
      }
      cursor = body.nextCursor;
    }

    return { items };
  },
});
