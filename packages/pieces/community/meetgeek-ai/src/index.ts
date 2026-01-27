import { createPiece, Piece, PieceAuth } from '@activepieces/pieces-framework';
import { getHighlights } from './lib/actions/get-highlights';
import { getMeetingDetails } from './lib/actions/get-meeting-details';
import { getMeetingsSummaryInsights } from './lib/actions/get-meetings-summary-insights';
import { getTeamMeetings } from './lib/actions/get-team-meetings';
import { getTranscript } from './lib/actions/get-transcript';
import { uploadRecording } from './lib/actions/upload-recording';
import { newMeeting } from './lib/triggers/new-meeting';
import { meetgeekaiAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';

export const meetgeekAi = createPiece({
  displayName: 'Meetgeek',
  auth: meetgeekaiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/meetgeek-ai.png',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.COMMUNICATION,
  ],
  description: 'AI-powered meeting assistant that automates note-taking, summarization, and insights generation for your meetings.',
  authors: ['sanket-a11y'],
  actions: [
    getHighlights,
    getMeetingDetails,
    getMeetingsSummaryInsights,
    getTeamMeetings,
    getTranscript,
    uploadRecording,
  ],
  triggers: [newMeeting],
});
