import { createPiece } from '@activepieces/pieces-framework';
import { letsCalendarAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';
import { addContactToCampaign } from './lib/actions/add-contact-to-campaign';
import { newCampaign } from './lib/triggers/new-campaign';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const letsCalendar = createPiece({
  displayName: `Let's Calendar`,
  auth: letsCalendarAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/lets-calendar.png',
  description: `Let's Calendar is a powerful calendar management tool that helps you organize your schedule, set reminders, and share events with ease.`,
  categories: [PieceCategory.COMMUNICATION],
  authors: ['sanket-a11y'],
  actions: [
    addContactToCampaign,
    createCustomApiCallAction({
      auth: letsCalendarAuth,
      description:
        "Make custom API calls to Let's Calendar. Note: An access token must first be generated using your client key and secret key via the /access_token endpoint. This access token is then used to authenticate all subsequent API requests by adding it to the Authorization header as 'Bearer ${accessToken}'.",
      baseUrl: () => `https://panel.letscalendar.com/api/lc`,
    }),
  ],
  triggers: [newCampaign],
});
