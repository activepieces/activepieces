import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const getUserStatus = createAction({
  auth: villageAuth,
  name: 'get_user_status',
  classification: 'READ',
  displayName: 'Get Network Status',
  description: 'Get whether your Village network is connected and synced, with the status of each connected Google or LinkedIn account. Free.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the connection/sync state of the caller\'s Village network (not_connected, syncing, ready, needs_attention) and each linked Google/LinkedIn integration. Check this first when network results look empty. Free, read-only.',
    idempotent: true,
  },
  outputSchema: villageSchemas.getUserStatus,
  props: {},
  async run(context) {
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/user/status',
    });
  },
});
