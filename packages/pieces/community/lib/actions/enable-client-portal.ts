import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeApiRequest } from '../common/client';

export const enableClientPortal = createAction({
  auth: ninjapipeAuth,
  name: 'enable_client_portal',
  displayName: 'Enable Client Portal',
  description: 'Enable client portal access for a contact',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      required: true,
    }),
    portalBody: Property.Json({
      displayName: 'Portal Settings (JSON)',
      description: 'Optional portal configuration',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const contactId = propsValue.contactId as string;
    const portalBody = propsValue.portalBody as Record<string, unknown> | undefined;

    const response = await ninjapipeApiRequest(
      auth as { base_url: string; api_key: string },
      HttpMethod.PUT,
      `/contacts/${contactId}/enable-client-portal`,
      portalBody || undefined,
    );

    return response;
  },
});
