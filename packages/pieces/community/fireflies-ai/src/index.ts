import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { findMeetingByIdAction } from './lib/actions/find-meeting-by-id';
import { findRecentMeetingAction } from './lib/actions/find-recent-meeting';
import { findMeetingByQueryAction } from './lib/actions/find-meeting-by-query';
import { uploadAudioAction } from './lib/actions/upload-audio';
import { getUserDetailsAction } from './lib/actions/get-user-details';
import { newTranscriptionCompleteTrigger } from './lib/triggers/new-transcription-complete';

const markdownDescription = `
To use Fireflies.ai, you need to get an API key:
1. Login to your account at https://fireflies.ai.
2. Navigate to Settings > API in the left sidebar.
3. Generate a new API key if you don't have one already.
4. Copy the API key to use with this integration.
`;

export const firefliesAiAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: markdownDescription,
	required: true,
});

export const firefliesAi = createPiece({
	displayName: 'Fireflies.ai',
	description: 'Meeting assistant that automatically records, transcribes, and analyzes conversations',
	logoUrl: 'https://cdn.brandfetch.io/idVVPG1ke4/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1700171440790',
	authors: ['AnkitSharmaOnGithub'],
	auth: firefliesAiAuth,
	actions: [
		findMeetingByIdAction,
		findRecentMeetingAction,
		findMeetingByQueryAction,
		uploadAudioAction,
		getUserDetailsAction
	],
	triggers: [newTranscriptionCompleteTrigger],
	categories: [PieceCategory.PRODUCTIVITY],
});
