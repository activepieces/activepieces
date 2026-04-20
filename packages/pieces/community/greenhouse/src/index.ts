import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { greenhouseAuth } from './lib/auth';
import { createCandidateAction } from './lib/actions/create-candidate';
import { createCandidateNoteAction } from './lib/actions/create-candidate-note';
import { createProspectAction } from './lib/actions/create-prospect';
import { updateCandidateAction } from './lib/actions/update-candidate';
import { findCandidateAction } from './lib/actions/find-candidate';
import { findOrCreateCandidateAction } from './lib/actions/find-or-create-candidate';
import { findDueScorecardAction } from './lib/actions/find-due-scorecard';
import { newCandidateApplicationTrigger } from './lib/triggers/new-candidate-application';
import { candidateHiredTrigger } from './lib/triggers/candidate-hired';
import { newJobPostTrigger } from './lib/triggers/new-job-post';
import { jobUpdatedTrigger } from './lib/triggers/job-updated';
import { newScheduledInterviewTrigger } from './lib/triggers/new-scheduled-interview';
import { newScorecardDueTrigger } from './lib/triggers/new-scorecard-due';

export const greenhouse = createPiece({
  displayName: 'Greenhouse',
  description: 'Recruiting and onboarding software',
  auth: greenhouseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/greenhouse.png',
  categories: [PieceCategory.HUMAN_RESOURCES],
  authors: [],
  actions: [
    createCandidateAction,
    createCandidateNoteAction,
    createProspectAction,
    updateCandidateAction,
    findCandidateAction,
    findOrCreateCandidateAction,
    findDueScorecardAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://harvest.greenhouse.io/v1',
      auth: greenhouseAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(`${(auth as { secret_text: string }).secret_text}:`).toString('base64')}`,
      }),
    }),
  ],
  triggers: [newCandidateApplicationTrigger, candidateHiredTrigger, newJobPostTrigger, jobUpdatedTrigger, newScheduledInterviewTrigger, newScorecardDueTrigger],
});
