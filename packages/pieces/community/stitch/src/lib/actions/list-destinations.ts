import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stitchAuth } from '../../';
import { makeConnectRequest, StitchDestination } from '../common';

export const listDestinationsAction = createAction({
  auth: stitchAuth,
  name: 'list_destinations',
  displayName: 'List Destinations',
  description: 'Returns all data destinations (warehouses) configured in your Stitch account.',
  props: {},
  async run(context) {
    const auth = context.auth as unknown as {
      connect_api_token: string;
      import_api_token: string;
      client_id: string;
    };
    const destinations = await makeConnectRequest<StitchDestination[]>(
      auth,
      HttpMethod.GET,
      '/v4/destinations'
    );
    return destinations.map((d) => ({
      id: d.id,
      display_name: d.display_name,
      type: d.type,
      stitch_client_id: d.stitch_client_id,
      created_at: d.created_at,
      updated_at: d.updated_at,
      deleted_at: d.deleted_at,
    }));
  },
});
