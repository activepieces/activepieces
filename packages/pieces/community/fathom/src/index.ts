import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getRecordingSummary } from './lib/actions/get-recording-summary';
import { getRecordingTranscript } from './lib/actions/get-recording-transcript';
import { listMeetings } from './lib/actions/list-meetings';
import { findTeam } from './lib/actions/find-team';
import { findTeamMember } from './lib/actions/find-team-member';
import { newRecording } from './lib/triggers/new-recording';

export const fathomAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Fathom API key',
  required: true
});

export const fathom = createPiece({
  displayName: 'Fathom',
  auth: fathomAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/fathom.png',
  authors: [],
  categories: [PieceCategory.PRODUCTIVITY],
  description:
    'AI meeting assistant that records, transcribes, and summarizes meetings',
  actions: [
    getRecordingSummary,
    getRecordingTranscript,
    listMeetings,
    findTeam,
    findTeamMember
  ],
  triggers: [newRecording]
});
