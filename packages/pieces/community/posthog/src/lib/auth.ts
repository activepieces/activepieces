import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { PostHogApiError, posthogClient } from './common/client';

export const posthogAuth = PieceAuth.CustomAuth({
  description: `Connect your PostHog account.

**Personal API Key**: Go to PostHog → Settings → Personal API Keys → Create personal API key.

**Project ID**: Found in the URL when viewing your project: \`/project/{id}/\`

**API Host**: The base URL for private API calls.
- US Cloud (default): \`https://us.posthog.com\`
- EU Cloud: \`https://eu.posthog.com\`
- Self-hosted: your instance URL (e.g. \`https://posthog.mycompany.com\`)

**Ingestion Host**: The base URL for event capture.
- US Cloud (default): \`https://us.i.posthog.com\`
- EU Cloud: \`https://eu.i.posthog.com\`
- Self-hosted: same as your API Host`,
  required: true,
  props: {
    personal_api_key: PieceAuth.SecretText({
      displayName: 'Personal API Key',
      description: 'Your PostHog personal API key',
      required: true,
    }),
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'Your PostHog project ID (found in project settings URL)',
      required: true,
    }),
    api_host: Property.ShortText({
      displayName: 'API Host',
      description: 'Base URL for private API calls (default: https://us.posthog.com)',
      required: false,
      defaultValue: 'https://us.posthog.com',
    }),
    ingestion_host: Property.ShortText({
      displayName: 'Ingestion Host',
      description: 'Base URL for event capture (default: https://us.i.posthog.com)',
      required: false,
      defaultValue: 'https://us.i.posthog.com',
    }),
  },
  validate: async ({ auth }) => {
    try {
      await posthogClient.request({ auth, method: HttpMethod.GET, path: posthogClient.projectPath({ auth }) });
      return { valid: true };
    } catch (error) {
      if (error instanceof PostHogApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid credentials: PostHog rejected the Personal API Key, or it has no access to this project.' };
      }
      if (error instanceof PostHogApiError && error.status === 404) {
        return { valid: false, error: 'Project not found. Check the Project ID and that the API Host matches your region (US or EU).' };
      }
      return { valid: false, error: error instanceof Error ? error.message : 'Could not reach PostHog.' };
    }
  },
});
