import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const setCustomFieldAction = createAction({
  name: 'set_custom_field',
  displayName: 'Set Custom Field',
  description: 'Sets a custom field value on a lead.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    fieldName: Property.ShortText({
      displayName: 'Field Name',
      description: 'The name of the custom field',
      required: true,
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'The value to set',
      required: true,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('leads/set-custom-field', {
      leadId: context.propsValue.leadId,
      fieldName: context.propsValue.fieldName,
      value: context.propsValue.value,
    });
  },
});
