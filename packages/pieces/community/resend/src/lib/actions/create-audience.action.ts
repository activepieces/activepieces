import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { createAudienceOutputSchema } from '../output-schemas';

export const createAudience = createAction({
  name: 'create_audience',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Create Audience',
  outputSchema: createAudienceOutputSchema,
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
    const response = await resendClient.sendRequest<{
      object: string;
      id: string;
      name: string;
      created_at: string;
    }>({ auth: auth.secret_text, method: HttpMethod.POST, path: '/audiences', body: { name: propsValue.name } });
    return response;
  },
});
