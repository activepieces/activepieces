import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const findLeadAction = createAction({
  name: 'find_lead',
  displayName: 'Find Lead',
  description: 'Find a lead by email address or get a lead by ID. Returns the full lead record with all fields, tags, and custom data.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Find lead by email address. Leave empty if using Lead ID.',
      required: false,
    }),
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'Get lead by ID. Leave empty if using email.',
      required: false,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('leads/find', {
      email: context.propsValue.email,
      leadId: context.propsValue.leadId,
    });
  },
});
