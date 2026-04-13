import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fathomAuth, FATHOM_API_BASE } from '../auth';

export const listSites = createAction({
  name: 'list_sites',
  displayName: 'List Sites',
  description: 'Return a list of all sites this API key has access to.',
  auth: fathomAuth,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of sites to return (1–100). Default is 10.',
      required: false,
      defaultValue: 10,
    }),
    starting_after: Property.ShortText({
      displayName: 'Starting After (Cursor)',
      description: 'Cursor for forward pagination — the last site ID from the previous page.',
      required: false,
    }),
    ending_before: Property.ShortText({
      displayName: 'Ending Before (Cursor)',
      description: 'Cursor for backward pagination — the first site ID from the previous page.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const params: Record<string, string> = {};

    if (propsValue.limit != null) params['limit'] = String(propsValue.limit);
    if (propsValue.starting_after) params['starting_after'] = propsValue.starting_after;
    if (propsValue.ending_before) params['ending_before'] = propsValue.ending_before;

    const response = await httpClient.sendRequest<{
      data: Array<{
        id: string;
        object: string;
        name: string;
        sharing: string;
        created_at: string;
      }>;
      has_more: boolean;
    }>({
      method: HttpMethod.GET,
      url: `${FATHOM_API_BASE}/sites`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      queryParams: params,
    });

    return response.body;
  },
});
