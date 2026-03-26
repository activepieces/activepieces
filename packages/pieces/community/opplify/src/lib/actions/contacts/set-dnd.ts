import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const setDndAction = createAction({
  name: 'set_dnd',
  displayName: 'Set Do Not Disturb',
  description: 'Enables or disables Do Not Disturb for a lead.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    enabled: Property.Checkbox({
      displayName: 'DND Enabled',
      description: 'Whether Do Not Disturb is enabled',
      required: true,
    }),
    channels: Property.Object({
      displayName: 'Channels',
      description:
        'Channel-specific DND: { email: true, sms: false, phone: false, whatsapp: false }',
      required: false,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('leads/set-dnd', {
      leadId: context.propsValue.leadId,
      enabled: context.propsValue.enabled,
      channels: context.propsValue.channels,
    });
  },
});
