import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stitchAuth } from '../../';
import { makeConnectRequest, sourceIdDropdown } from '../common';

export const deleteSourceAction = createAction({
  auth: stitchAuth,
  name: 'delete_source',
  displayName: 'Delete Source',
  description: 'Deletes a data source from your Stitch account. This action cannot be undone.',
  props: {
    source_id: sourceIdDropdown,
  },
  async run(context) {
    const auth = context.auth as unknown as {
      connect_api_token: string;
      import_api_token: string;
      client_id: string;
    };
    await makeConnectRequest<unknown>(
      auth,
      HttpMethod.DELETE,
      `/v4/sources/${context.propsValue.source_id}`
    );
    return {
      success: true,
      source_id: context.propsValue.source_id,
      message: 'Source deleted successfully.',
    };
  },
});
