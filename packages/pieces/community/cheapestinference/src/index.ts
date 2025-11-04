import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { jobCompletedTrigger } from './lib/triggers/job-completed.trigger'
import { submitSyncJob } from './lib/actions/submit-sync-job.action'
import { submitAsyncJob } from './lib/actions/submit-async-job.action'

export const cheapestinferenceAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use your API Key',
});

export const cheapestinference = createPiece({
  displayName: "Cheapestinference",
  description: 'Submit and manage AI inference jobs at the lowest cost.',
  auth: cheapestinferenceAuth,
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  logoUrl: "https://cheapestinference.com/logo.svg",
  authors: ['cheapestinference', 'appsdev'],
  actions: [
    submitSyncJob,
    submitAsyncJob
  ],
  triggers: [
    jobCompletedTrigger,
  ],
});
