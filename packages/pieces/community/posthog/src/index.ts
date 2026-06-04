import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { posthogCreateEvent } from './lib/actions/create-event';
import { posthogCreateProject } from './lib/actions/create-project';
import { posthogGetFeatureFlags } from './lib/actions/get-feature-flags';
import { posthogListPersons } from './lib/actions/list-persons';
import { posthogNewEvent } from './lib/triggers/new-event';

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
      const apiHost = auth.api_host || 'https://us.posthog.com';
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${apiHost}/api/projects/${auth.project_id}/`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.personal_api_key,
        },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid credentials. Check your Personal API Key and Project ID.' };
    }
  },
});

export const posthog = createPiece({
  displayName: 'PostHog',
  description: 'Open-source product analytics',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/posthog.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: posthogAuth,
  actions: [
    posthogCreateEvent,
    posthogCreateProject,
    posthogGetFeatureFlags,
    posthogListPersons,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as PostHogConnection).props.api_host || 'https://us.posthog.com',
      auth: posthogAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as PostHogConnection).props.personal_api_key}`,
      }),
    }),
  ],
  authors: ['kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'Tosh94'],
  triggers: [posthogNewEvent],
});

export type PostHogAuth = {
  personal_api_key: string;
  project_id: string;
  api_host?: string;
  ingestion_host?: string;
};

type PostHogConnection = { props: PostHogAuth };
