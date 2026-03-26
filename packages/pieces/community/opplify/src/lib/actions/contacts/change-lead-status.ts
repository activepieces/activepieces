import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const changeLeadStatusAction = createAction({
  name: 'change_lead_status',
  displayName: 'Change Lead Status',
  description:
    'Changes a lead\'s status (e.g., new to contacted, qualified to converted).',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'New lead status',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'New', value: 'new' },
          { label: 'Contacted', value: 'contacted' },
          { label: 'Qualified', value: 'qualified' },
          { label: 'Converted', value: 'converted' },
          { label: 'Lost', value: 'lost' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('leads/change-status', {
      leadId: context.propsValue.leadId,
      status: context.propsValue.status,
    });
  },
});
