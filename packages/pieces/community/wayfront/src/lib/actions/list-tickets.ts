import { createAction, Property } from '@activepieces/pieces-framework';
import { wayfrontAuth } from '../auth';
import {
  flattenTicket,
  wayfrontApiClient,
  WayfrontAuthType,
  WayfrontListResponse,
  WayfrontTicket,
} from '../common';

export const listTicketsAction = createAction({
  auth: wayfrontAuth,
  name: 'list_tickets',
  displayName: 'List Tickets',
  description: 'Returns a list of tickets from your Wayfront workspace, sorted by most recent first.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of tickets to return per page. Defaults to 20.',
      required: false,
      defaultValue: 20,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to retrieve when results span multiple pages. Starts at 1.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const auth = context.auth as unknown as WayfrontAuthType;
    const p = context.propsValue;

    const queryParams: Record<string, string> = {
      limit: String(p.limit ?? 20),
      page: String(p.page ?? 1),
    };

    const response = await wayfrontApiClient(auth.workspaceUrl, auth.apiToken).get<
      WayfrontListResponse<WayfrontTicket>
    >('/tickets', queryParams);

    return response.body.data.map(flattenTicket);
  },
});
