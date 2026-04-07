import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stitchAuth } from '../../';
import { makeConnectRequest, StitchSource } from '../common';

export const listSourcesAction = createAction({
  auth: stitchAuth,
  name: 'list_sources',
  displayName: 'List Sources',
  description: 'Returns all data sources connected to your Stitch account.',
  props: {},
  async run(context) {
    const auth = context.auth as unknown as {
      connect_api_token: string;
      import_api_token: string;
      client_id: string;
    };
    const sources = await makeConnectRequest<StitchSource[]>(
      auth,
      HttpMethod.GET,
      '/v4/sources'
    );
    return sources.map((s) => ({
      id: s.id,
      display_name: s.display_name,
      type: s.type,
      stitch_client_id: s.stitch_client_id,
      created_at: s.created_at,
      updated_at: s.updated_at,
      deleted_at: s.deleted_at,
      paused_at: s.paused_at,
      system_paused: s.system_paused,
    }));
  },
});
