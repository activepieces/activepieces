import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const adjustLeadScoreAction = createAction({
  name: 'adjust_lead_score',
  displayName: 'Adjust Lead Score',
  description: "Adjusts a lead's score by adding or subtracting points.",
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    delta: Property.Number({
      displayName: 'Points Delta',
      description: 'Points to add (positive) or subtract (negative)',
      required: true,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('leads/adjust-score', {
      leadId: context.propsValue.leadId,
      delta: context.propsValue.delta,
    });
  },
});
