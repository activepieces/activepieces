import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'

import { findMeetingByIdAction } from './lib/actions/find-meeting-by-id'
import { findMeetingByQueryAction } from './lib/actions/find-meeting-by-query'
import { findRecentMeetingAction } from './lib/actions/find-recent-meeting'
import { getUserDetailsAction } from './lib/actions/get-user-details'
import { uploadAudioAction } from './lib/actions/upload-audio'
import { firefliesAiAuth } from './lib/auth'
import { newTranscriptionCompletedTrigger } from './lib/triggers/new-transcription-complete'

const markdownDescription = `
To use Fireflies.ai, you need to get an API key:
1. Login to your account at https://fireflies.ai.
2. Navigate to Settings > Developer Settings in the left sidebar.
3. Copy the API key from the API Key section.
`

export const firefliesAi = createPiece({
    displayName: 'Fireflies.ai',
    description: 'Meeting assistant that automatically records, transcribes, and analyzes conversations',
    logoUrl: 'https://cdn.activepieces.com/pieces/fireflies-ai.png',
    authors: ['AnkitSharmaOnGithub'],
    auth: firefliesAiAuth,
    actions: [
        findMeetingByIdAction,
        findRecentMeetingAction,
        findMeetingByQueryAction,
        uploadAudioAction,
        getUserDetailsAction,
    ],
    triggers: [newTranscriptionCompletedTrigger],
    categories: [PieceCategory.PRODUCTIVITY],
})
