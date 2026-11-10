import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { findMeetingByIdAction } from './lib/actions/find-meeting-by-id';
import { findRecentMeetingAction } from './lib/actions/find-recent-meeting';
import { findMeetingByQueryAction } from './lib/actions/find-meeting-by-query';
import { uploadAudioAction } from './lib/actions/upload-audio';
import { getUserDetailsAction } from './lib/actions/get-user-details';
import { searchMeetingsAction } from './lib/actions/ai/search-meetings';
import { getMeetingAction } from './lib/actions/ai/get-meeting';
import { getMeetingSummaryAction } from './lib/actions/ai/get-meeting-summary';
import { getMeetingTranscriptAction } from './lib/actions/ai/get-meeting-transcript';
import { getCurrentUserAction } from './lib/actions/ai/get-current-user';
import { listUsersAction } from './lib/actions/ai/list-users';
import { listChannelsAction } from './lib/actions/ai/list-channels';
import { listContactsAction } from './lib/actions/ai/list-contacts';
import { moveMeetingsToChannelAction } from './lib/actions/ai/move-meetings-to-channel';
import { updateMeetingTitleAction } from './lib/actions/ai/update-meeting-title';
import { updateMeetingPrivacyAction } from './lib/actions/ai/update-meeting-privacy';
import { shareMeetingAction } from './lib/actions/ai/share-meeting';
import { revokeMeetingAccessAction } from './lib/actions/ai/revoke-meeting-access';
import { deleteMeetingAction } from './lib/actions/ai/delete-meeting';
import { askFredAction } from './lib/actions/ai/ask-fred';
import { createSoundbiteAction } from './lib/actions/ai/create-soundbite';
import { addBotToLiveMeetingAction } from './lib/actions/ai/add-bot-to-live-meeting';
import { firefliesCustomApiCall } from './lib/actions/custom-api-call';
import { newTranscriptionCompletedTrigger } from './lib/triggers/new-transcription-complete';
import { meetingSummarizedTrigger } from './lib/triggers/meeting-summarized';
import { firefliesAiAuth } from './lib/auth';

export const firefliesAi = createPiece({
  displayName: 'Fireflies.ai',
  description: 'Meeting assistant that automatically records, transcribes, and analyzes conversations',
  logoUrl: 'https://cdn.activepieces.com/pieces/fireflies-ai.png',
  authors: ['AnkitSharmaOnGithub', 'OdaiAhmed99'],
  auth: firefliesAiAuth,
  minimumSupportedRelease: '0.88.2',
  actions: [
    findMeetingByIdAction,
    findRecentMeetingAction,
    findMeetingByQueryAction,
    uploadAudioAction,
    getUserDetailsAction,
    searchMeetingsAction,
    getMeetingAction,
    getMeetingSummaryAction,
    getMeetingTranscriptAction,
    getCurrentUserAction,
    listUsersAction,
    listChannelsAction,
    listContactsAction,
    moveMeetingsToChannelAction,
    updateMeetingTitleAction,
    updateMeetingPrivacyAction,
    shareMeetingAction,
    revokeMeetingAccessAction,
    deleteMeetingAction,
    askFredAction,
    createSoundbiteAction,
    addBotToLiveMeetingAction,
    firefliesCustomApiCall,
  ],
  triggers: [newTranscriptionCompletedTrigger, meetingSummarizedTrigger],
  categories: [PieceCategory.PRODUCTIVITY],
});
