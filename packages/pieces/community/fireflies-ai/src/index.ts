import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';

import { findMeetingByIdAction } from './lib/actions/find-meeting-by-id';
import { findRecentMeetingAction } from './lib/actions/find-recent-meeting';
import { findMeetingByQueryAction } from './lib/actions/find-meeting-by-query';
import { uploadAudioAction } from './lib/actions/upload-audio';
import { getUserDetailsAction } from './lib/actions/get-user-details';
import { newTranscriptionCompletedTrigger } from './lib/triggers/new-transcription-complete';
import { firefliesAiAuth } from './lib/auth';

export const firefliesAi = createPiece({
	displayName: 'Fireflies.ai',
	description: 'Meeting assistant that automatically records, transcribes, and analyzes conversations',
	logoUrl: 'https://cdn.activepieces.com/pieces/fireflies-ai.png',
	authors: ['AnkitSharmaOnGithub'],
	auth: firefliesAiAuth,
	minimumSupportedRelease: '0.88.2',
	actions: [
		findMeetingByIdAction,
		findRecentMeetingAction,
		findMeetingByQueryAction,
		uploadAudioAction,
		getUserDetailsAction
	],
	triggers: [newTranscriptionCompletedTrigger],
	categories: [PieceCategory.PRODUCTIVITY],
});
