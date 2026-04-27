import { createCustomApiCallAction } from '@activepieces/pieces-common';
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

**Project API Key**: Found in PostHog → Project Settings → Project API Key.

**Project ID**: Found in the URL when viewing your project: \`/project/{id}/\``,
  required: true,
  props: {
    personal_api_key: Property.SecretText({
      displayName: 'Personal API Key',
      description: 'Your PostHog personal API key (for reading data)',
      required: true,
    }),
    project_api_key: Property.SecretText({
      displayName: 'Project API Key',
      description: 'Your PostHog project API key (for capturing events)',
      required: true,
    }),
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'Your PostHog project ID (found in project settings URL)',
      required: true,
    }),
    host: Property.ShortText({
      displayName: 'Host URL',
      description: 'PostHog host URL (default: https://app.posthog.com)',
      required: false,
      defaultValue: 'https://app.posthog.com',
    }),
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
      baseUrl: (auth) => (auth as { host?: string }).host || 'https://app.posthog.com',
      auth: posthogAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { personal_api_key: string }).personal_api_key}`,
      }),
    }),
  ],
  authors: ['kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'Tosh94'],
  triggers: [posthogNewEvent],
});
