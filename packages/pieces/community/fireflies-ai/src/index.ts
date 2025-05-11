import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { fireflyService } from './lib/common/fireflyService';
import { findMeetingById } from './lib/actions/find-meeting-by-id';
import { findMeetingByQuery } from './lib/actions/find-meeting-by-query';
import { findRecentMeeting } from './lib/actions/find-recent-meeting';
import { getUserDetails } from './lib/actions/get-user-details';
import { uploadAudio } from './lib/actions/upload-audio';
import { newTranscriptionComplete } from './lib/triggers/new-transcription-complete';

const description = `
Follow these steps to obtain your Fireflies AI API Key:

1. Log in to your account at [app.fireflies.ai](https://app.fireflies.ai)
2. Navigate to the Integrations section
3. Click on Fireflies API
4. Copy your API key
`;

export const firefliesAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description,
  async validate({ auth }) {
    try {
      await fireflyService.getUsers(auth);
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});

export const firefliesAi = createPiece({
  displayName: 'Fireflies-ai',
  auth: firefliesAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/fireflies-ai.png',
  authors: ['iambenkay'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [findMeetingById, findMeetingByQuery, findRecentMeeting, getUserDetails, uploadAudio],
  triggers: [newTranscriptionComplete],
});
