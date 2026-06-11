import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { cancelJob } from './lib/actions/cancel-job';
import { estimateJob } from './lib/actions/estimate-job';
import { getArtifactDownloadUrl } from './lib/actions/get-artifact-download-url';
import { getJobEvents } from './lib/actions/get-job-events';
import { getJobLogs } from './lib/actions/get-job-logs';
import { getJobRuntime } from './lib/actions/get-job-runtime';
import { getJobStatus } from './lib/actions/get-job-status';
import { listJobInputs } from './lib/actions/list-job-inputs';
import { listArtifacts } from './lib/actions/list-artifacts';
import { listJobs } from './lib/actions/list-jobs';
import { submitJob } from './lib/actions/submit-job';
import { uploadJobInput } from './lib/actions/upload-job-input';
import { jungleGridAuth } from './lib/auth';
import { jungleGridCommon } from './lib/common';

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
    uploadJobInput,
    submitJob,
    listJobInputs,
    listJobs,
    getJobStatus,
    getJobEvents,
    getJobRuntime,
    getJobLogs,
    listArtifacts,
    getArtifactDownloadUrl,
    cancelJob,
    createCustomApiCallAction({
      baseUrl: (auth) => jungleGridCommon.normalizeBaseUrl(auth?.props.api_base_url ?? jungleGridCommon.defaultBaseUrl),
      auth: jungleGridAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.api_key}`,
      }),
    }),
  ],
  triggers: [],
});
