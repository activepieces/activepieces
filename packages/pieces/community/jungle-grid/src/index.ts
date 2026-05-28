import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { estimateJob } from './lib/actions/estimate-job';
import { getArtifactDownloadUrl } from './lib/actions/get-artifact-download-url';
import { getJobLogs } from './lib/actions/get-job-logs';
import { getJobStatus } from './lib/actions/get-job-status';
import { listArtifacts } from './lib/actions/list-artifacts';
import { submitJob } from './lib/actions/submit-job';
import { jungleGridCommon } from './lib/common';

export const jungleGridAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  description:
    'Connect with a Jungle Grid API key or bearer token. Use the default API base URL unless your Jungle Grid workspace provides a custom endpoint.',
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
      displayName: 'API Key or Bearer Token',
      description: 'Paste the Jungle Grid API key or bearer token for your workspace.',
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
    getJobStatus,
    getJobLogs,
    listArtifacts,
    getArtifactDownloadUrl,
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
