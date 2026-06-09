import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';

export const createAudience = createAction({
  name: 'create_audience',
  auth: resendAuth,
  displayName: 'Create Audience',
  description: 'Create a new contact audience in Resend',
  audience: 'both',
  aiMetadata: { description: 'Creates a new contact audience (mailing list) in Resend with the given name and returns its ID. Use this before adding contacts or sending broadcasts when no suitable audience exists yet. Not idempotent — each call creates a new audience even if the name matches an existing one.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Audience Name',
      description: 'A label for this audience, e.g. "Newsletter Subscribers"',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest<{
      object: string;
      id: string;
      name: string;
      created_at: string;
    }>({
      method: HttpMethod.POST,
      url: 'https://api.resend.com/audiences',
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
      body: { name: propsValue.name },
    });
    return response.body;
  },
});
