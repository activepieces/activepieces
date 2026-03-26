import { createAction } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { funnelIdDropdown } from '../../common/props';

export const unpublishFunnelAction = createAction({
  name: 'unpublish_funnel',
  displayName: 'Unpublish Funnel',
  description: 'Takes a published funnel offline.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    funnelId: funnelIdDropdown,
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('funnels/unpublish', {
      funnelId: context.propsValue.funnelId,
    });
  },
});
