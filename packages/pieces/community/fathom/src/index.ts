import { createPiece } from '@activepieces/pieces-framework';
import { fathomAuth } from './lib/common/auth';
import { newRecording } from './lib/triggers/new-recording';
import { getRecordingSummary } from './lib/actions/get-recording-summary';
import { getRecordingTranscript } from './lib/actions/get-recording-transcript';
import { listTeams } from './lib/actions/find-team';
import { listTeamMembers } from './lib/actions/find-team-member';
import { listMeetings } from './lib/actions/list-meetings';

export const fathom = createPiece({
  displayName: 'Fathom',
  auth: fathomAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/fathom.png',
  authors: [],
  actions: [
    listMeetings,
    getRecordingSummary,
    getRecordingTranscript,
    listTeams,
    listTeamMembers,
  ],
  triggers: [newRecording],
});
