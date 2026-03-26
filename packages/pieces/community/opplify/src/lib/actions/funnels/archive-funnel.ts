import { createAction } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { funnelIdDropdown } from '../../common/props';

export const archiveFunnelAction = createAction({
  name: 'archive_funnel',
  displayName: 'Archive Funnel',
  description: 'Archives a funnel.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    funnelId: funnelIdDropdown,
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('funnels/archive', {
      funnelId: context.propsValue.funnelId,
    });
  },
});
