import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const updateDealStageAction = createAction({
  name: 'update_deal_stage',
  displayName: 'Update Deal Stage',
  description: 'Moves a deal to a different pipeline stage.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    dealId: Property.ShortText({
      displayName: 'Deal ID',
      description: 'The ID of the deal',
      required: true,
    }),
    stage: Property.StaticDropdown({
      displayName: 'Deal Stage',
      description: 'New deal stage',
      required: true,
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
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('deals/update-stage', {
      dealId: context.propsValue.dealId,
      stage: context.propsValue.stage,
    });
  },
});
