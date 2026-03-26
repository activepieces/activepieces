import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { userDropdown } from '../../common/props';

export const createDealAction = createAction({
  name: 'create_deal',
  displayName: 'Create Deal',
  description: 'Creates a new deal in the pipeline for a lead.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Deal title',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Deal amount',
      required: false,
    }),
    stage: Property.StaticDropdown({
      displayName: 'Deal Stage',
      description: 'Deal pipeline stage',
      required: false,
      defaultValue: 'discovery',
      options: {
        disabled: false,
        options: [
          { label: 'Discovery', value: 'discovery' },
          { label: 'Proposal', value: 'proposal' },
          { label: 'Negotiation', value: 'negotiation' },
          { label: 'Closed Won', value: 'closed_won' },
          { label: 'Closed Lost', value: 'closed_lost' },
        ],
      },
    }),
    probability: Property.Number({
      displayName: 'Probability',
      description: '0-100',
      required: false,
    }),
    expectedCloseDate: Property.ShortText({
      displayName: 'Expected Close Date',
      description: 'Expected close date (ISO 8601)',
      required: false,
    }),
    assignedTo: userDropdown,
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('deals/create', {
      leadId: context.propsValue.leadId,
      title: context.propsValue.title,
      amount: context.propsValue.amount,
      stage: context.propsValue.stage,
      probability: context.propsValue.probability,
      expectedCloseDate: context.propsValue.expectedCloseDate,
      assignedTo: context.propsValue.assignedTo,
    });
  },
});
