import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const deleteDealAction = createAction({
  name: 'delete_deal',
  displayName: 'Delete Deal',
  description: 'Permanently deletes a deal.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    dealId: Property.ShortText({
      displayName: 'Deal ID',
      description: 'The ID of the deal to delete',
      required: true,
    }),
    confirm: Property.Checkbox({
      displayName: 'Confirm Deletion',
      description: 'Must be checked to delete',
      required: true,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('deals/delete', {
      dealId: context.propsValue.dealId,
      confirm: context.propsValue.confirm,
    });
  },
});
