import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getBatchResultsAction } from './lib/actions/get-batch-results';
import { getBatchStatusAction } from './lib/actions/get-batch-status';
import { startBatchVerificationAction } from './lib/actions/start-batch-verification';
import { verifyEmailAction } from './lib/actions/verify-email';
import { mailflossAuth } from './lib/auth';
import { MAILFLOSS_API_URL } from './lib/common/client';
import { emailUndeliverableTrigger } from './lib/triggers/email-undeliverable';
import { verificationJobFinishedTrigger } from './lib/triggers/verification-job-finished';

export const mailfloss = createPiece({
  displayName: 'mailfloss',
  description: 'Verify email addresses in real time or in batches.',
  auth: mailflossAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/mailfloss.png',
  categories: [PieceCategory.MARKETING],
  authors: ['landland'],
  actions: [
    verifyEmailAction,
    startBatchVerificationAction,
    getBatchStatusAction,
    getBatchResultsAction,
    createCustomApiCallAction({
      baseUrl: () => `${MAILFLOSS_API_URL}/v1`,
      auth: mailflossAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [verificationJobFinishedTrigger, emailUndeliverableTrigger],
});
