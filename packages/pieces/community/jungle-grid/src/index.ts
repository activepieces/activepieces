import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { estimateJob } from './lib/actions/estimate-job';
import { getJobRuntime } from './lib/actions/get-job-runtime';
import { getJobStatus } from './lib/actions/get-job-status';
import { listJobs } from './lib/actions/list-jobs';
import { submitJob } from './lib/actions/submit-job';
import { jungleGridCommon } from './lib/common';

export const jungleGridAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  description:
    'Connect with a Jungle Grid API key. Create one under **Developer → API Keys** in your Jungle Grid portal, then paste it below. Keep the default API base URL unless your workspace provides a custom endpoint.',
  required: true,
  props: {
    api_base_url: Property.ShortText({
      displayName: 'API Base URL',
      description:
        'Base URL for the Jungle Grid API. Replace this when your Jungle Grid workspace provides a specific API endpoint.',
      required: true,
      defaultValue: jungleGridCommon.defaultBaseUrl,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description:
        'Your Jungle Grid API key. Create and copy it from **Developer → API Keys** in the portal. It is sent as a Bearer token in the Authorization header.',
      required: true,
    }),
  },
});

export const jungleGrid = createPiece({
  displayName: 'Jungle Grid',
  description:
    'Submit async compute jobs, monitor status and logs, and retrieve artifacts from Jungle Grid.',
  auth: jungleGridAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/jungle-grid.png',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.DEVELOPER_TOOLS,
  ],
  authors: ['junglegrid'],
  actions: [
    estimateJob,
    submitJob,
    listJobs,
    getJobStatus,
    getJobRuntime,
    createCustomApiCallAction({
      auth: jungleGridAuth,
      baseUrl: (auth) =>
        jungleGridCommon.normalizeBaseUrl(
          auth?.props.api_base_url ?? jungleGridCommon.defaultBaseUrl,
        ),
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.api_key}`,
      }),
    }),
  ],
  triggers: [],
});
