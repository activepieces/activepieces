import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stitchAuth } from '../../';
import { makeConnectRequest, sourceIdDropdown, StitchSource } from '../common';

export const getSourceAction = createAction({
  auth: stitchAuth,
  name: 'get_source',
  displayName: 'Get Source',
  description: 'Returns the configuration and status of a specific data source.',
  props: {
    source_id: sourceIdDropdown,
  },
  async run(context) {
    const auth = context.auth as unknown as {
      connect_api_token: string;
      import_api_token: string;
      client_id: string;
    };
    const source = await makeConnectRequest<StitchSource>(
      auth,
      HttpMethod.GET,
      `/v4/sources/${context.propsValue.source_id}`
    );
    return {
      id: source.id,
      display_name: source.display_name,
      type: source.type,
      stitch_client_id: source.stitch_client_id,
      created_at: source.created_at,
      updated_at: source.updated_at,
      deleted_at: source.deleted_at,
      paused_at: source.paused_at,
      system_paused: source.system_paused,
    };
  },
});
