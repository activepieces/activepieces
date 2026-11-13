import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationCreateIntegrationTokenOutputSchema } from '../../output-schemas';

export const createIntegrationToken = createAction({
  auth: presentonAuth,
  name: 'presentation_create_integration_token',
  outputSchema: presentationCreateIntegrationTokenOutputSchema,
  displayName: 'Create Integration Token',
  description: 'Create an embed token for viewing or editing a presentation.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a scoped integration token and frontend URL for embedding one presentation. Get the presentation id from presentation_list_presentations. Each call issues a new token.',
    idempotent: false,
  },
  props: {
    presentation: Property.ShortText({ displayName: 'Presentation ID', required: true }),
    scopes: Property.StaticMultiSelectDropdown({
      displayName: 'Scopes',
      required: true,
      options: {
        options: [
          { value: 'presentation:read', label: 'Read' },
          { value: 'presentation:edit', label: 'Edit' },
          { value: 'presentation:export', label: 'Export' },
        ],
      },
    }),
    expires_at: Property.ShortText({ displayName: 'Expires At', description: 'ISO 8601 date-time.', required: false }),
  },
  async run({ auth, propsValue }) {
    return presentonClient.request<Record<string, unknown>>({
      auth: auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v3/presentation/integrate',
      body: presentonClient.dropUndefined({
        presentation: propsValue.presentation,
        scopes: propsValue.scopes,
        expires_at: propsValue.expires_at,
      }),
    });
  },
});
