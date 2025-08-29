import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

// Import actions
import { createCallAction } from './lib/actions/create-call';
import { getMeetingRecordingAction } from './lib/actions/get-meeting-recording';
import { getMeetingTranscriptionAction } from './lib/actions/get-meeting-transcription';

// Import triggers
import { newNoteTrigger } from './lib/triggers/new-note';
import { newMeetingScheduledTrigger } from './lib/triggers/new-meeting-scheduled';
import { meetingRescheduledTrigger } from './lib/triggers/meeting-rescheduled';
import { meetingCancelledTrigger } from './lib/triggers/meeting-cancelled';

const authMarkdown = `
To obtain your Avoma API credentials:

1. Sign up for a Business plan trial at https://www.avoma.com/pricing
2. Log in to your Avoma account
3. Navigate to **Settings** → **Integrations** → **API**
4. Generate a new API token
5. Copy the API token and your Account ID
`;

export const avomaAuth = PieceAuth.CustomAuth({
  required: true,
  description: authMarkdown,
  props: {
    apiToken: PieceAuth.SecretText({
      displayName: 'API Token',
      required: true,
      description: 'Your Avoma API token from the API settings page',
    }),
    accountId: PieceAuth.ShortText({
      displayName: 'Account ID',
      required: true,
      description: 'Your Avoma Account ID',
    }),
  },
  validate: async ({ auth }) => {
    try {
      const response = await fetch('https://api.avoma.com/v1/meetings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.apiToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        return { valid: true };
      }
      
      return {
        valid: false,
        error: 'Invalid API credentials',
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate credentials',
      };
    }
  },
});

export const avoma = createPiece({
  displayName: 'Avoma',
  description: 'AI-powered meeting assistant for transcription, insights, and analysis',
  auth: avomaAuth,
  minimumSupportedRelease: '0.50.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/avoma.png',
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.COMMUNICATION],
  authors: ['sudarshan-magar7'],
  actions: [
    createCallAction,
    getMeetingRecordingAction,
    getMeetingTranscriptionAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.avoma.com/v1',
      auth: avomaAuth,
      authMapping: async (auth) => ({
        'Authorization': `Bearer ${auth.apiToken}`,
      }),
    }),
  ],
  triggers: [
    newNoteTrigger,
    newMeetingScheduledTrigger,
    meetingRescheduledTrigger,
    meetingCancelledTrigger,
  ],
});