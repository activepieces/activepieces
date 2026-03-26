import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const changeLifecycleStageAction = createAction({
  name: 'change_lifecycle_stage',
  displayName: 'Change Lifecycle Stage',
  description: "Changes a lead's lifecycle stage in the sales funnel.",
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    stage: Property.StaticDropdown({
      displayName: 'Lifecycle Stage',
      description: 'New lifecycle stage',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Subscriber', value: 'subscriber' },
          { label: 'Lead', value: 'lead' },
          { label: 'Marketing Qualified Lead', value: 'marketing_qualified_lead' },
          { label: 'Sales Qualified Lead', value: 'sales_qualified_lead' },
          { label: 'Opportunity', value: 'opportunity' },
          { label: 'Customer', value: 'customer' },
          { label: 'Evangelist', value: 'evangelist' },
        ],
      },
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('leads/change-lifecycle', {
      leadId: context.propsValue.leadId,
      stage: context.propsValue.stage,
    });
  },
});
