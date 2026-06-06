import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { cancelJob } from './lib/actions/cancel-job';
import { estimateJob } from './lib/actions/estimate-job';
import { getArtifactDownloadUrl } from './lib/actions/get-artifact-download-url';
import { getJobLogs } from './lib/actions/get-job-logs';
import { getJobRuntime } from './lib/actions/get-job-runtime';
import { getJobStatus } from './lib/actions/get-job-status';
import { listArtifacts } from './lib/actions/list-artifacts';
import { listJobs } from './lib/actions/list-jobs';
import { submitJob } from './lib/actions/submit-job';
import { jungleGridAuth } from './lib/auth';

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
    getJobLogs,
    listArtifacts,
    getArtifactDownloadUrl,
    cancelJob,
  ],
  triggers: [],
});
