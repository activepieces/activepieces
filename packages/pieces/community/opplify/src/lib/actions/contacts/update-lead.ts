import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const updateLeadAction = createAction({
  name: 'update_lead',
  displayName: 'Update Lead',
  description: "Updates an existing lead's information.",
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead to update',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'New email address',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'New first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'New last name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'New phone number',
      required: false,
    }),
    customFields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Custom field key-value pairs to update',
      required: false,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('leads/update', {
      leadId: context.propsValue.leadId,
      email: context.propsValue.email,
      firstName: context.propsValue.firstName,
      lastName: context.propsValue.lastName,
      phone: context.propsValue.phone,
      customFields: context.propsValue.customFields,
    });
  },
});
