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
  authors: ["fortunamide", "onyedikachi-david"],
  categories: [PieceCategory.PRODUCTIVITY],
  description: 'Fathom is an AI meeting assistant that automatically records, transcribes, highlights, and generates AI summaries and action items from your meetings. Integrate with workflows to react to meeting events and retrieve meeting data.',
  actions: [getRecordingSummary, getRecordingTranscript, listMeetings, findTeam, findTeamMember],
  triggers: [newRecording],
});
