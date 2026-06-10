import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fathomAuth, FATHOM_API_BASE } from '../auth';

export const listEvents = createAction({
  name: 'list_events',
  displayName: 'List Events',
  description: 'List all custom events (goals) for a specific site.',
  auth: fathomAuth,
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The unique identifier for the Fathom site.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of events to return (1–100). Default is 10.',
      required: false,
      defaultValue: 10,
    }),
    starting_after: Property.ShortText({
      displayName: 'Starting After (Cursor)',
      description: 'Cursor for forward pagination — the last event ID from the previous page.',
      required: false,
    }),
    ending_before: Property.ShortText({
      displayName: 'Ending Before (Cursor)',
      description: 'Cursor for backward pagination — the first event ID from the previous page.',
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
        site_id: string;
        created_at: string;
      }>;
      has_more: boolean;
    }>({
      method: HttpMethod.GET,
      url: `${FATHOM_API_BASE}/sites/${propsValue.site_id}/events`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      queryParams: params,
    });

    return response.body;
  },
});
