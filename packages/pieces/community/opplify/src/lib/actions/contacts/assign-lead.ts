import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { userDropdown } from '../../common/props';

export const assignLeadAction = createAction({
  name: 'assign_lead',
  displayName: 'Assign Lead',
  description: 'Assigns a lead to a team member.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    assignedTo: userDropdown,
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('leads/assign', {
      leadId: context.propsValue.leadId,
      assignedTo: context.propsValue.assignedTo,
    });
  },
});
