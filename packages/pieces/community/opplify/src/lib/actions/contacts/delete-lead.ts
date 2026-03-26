import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const deleteLeadAction = createAction({
  name: 'delete_lead',
  displayName: 'Delete Lead',
  description:
    'Permanently deletes a lead from the CRM. This action cannot be undone.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead to delete',
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
    return await client.callAction('leads/delete', {
      leadId: context.propsValue.leadId,
      confirm: context.propsValue.confirm,
    });
  },
});
