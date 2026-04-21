import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCustomApiCallAction, HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

import { getCurrentUserAction } from './lib/actions/get-current-user';
import { listEventsAction } from './lib/actions/list-events';
import { getEventAction } from './lib/actions/get-event';
import { cancelEventAction } from './lib/actions/cancel-event';
import { createEventAction } from './lib/actions/create-event';
import { findEventsByEmailAction } from './lib/actions/find-events-by-email';
import { listSchedulingLinksAction } from './lib/actions/list-scheduling-links';

import { newEventTrigger } from './lib/triggers/new-event';
import { newCheckoutTrigger } from './lib/triggers/new-checkout';
import { newAttendeeEventTrigger } from './lib/triggers/new-attendee-event';
import { newPollResponseTrigger } from './lib/triggers/new-poll-response';
import { workflowActionTriggeredTrigger } from './lib/triggers/workflow-action-triggered';

import { SAVVYCAL_BASE_URL } from './lib/common';

export const savvyCalAuth = PieceAuth.SecretText({
  displayName: 'Personal Access Token (Private Key)',
  description: `To get your SavvyCal API token:
1. Log in to your SavvyCal account at https://savvycal.com
2. Go to **Settings > Developers**
3. Under **Personal Tokens**, click **Create a token**
4. Give it a name, then click the **...** menu next to it to view the token
5. Copy the **Private Key** (starts with \`pt_secret_\`) — not the Public Key

**Note:** Keep this token secret — it gives full access to your SavvyCal account.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${SAVVYCAL_BASE_URL}/me`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid token. Please check your Personal Access Token and try again.' };
    }
  },
});

export const savvyCal = createPiece({
  displayName: 'SavvyCal',
  description: 'Scheduling tool that lets invitees overlay their calendar when picking a time.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/savvycal.png',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: savvyCalAuth,
  authors: ['bst1n','sanket-a11y'],
  actions: [
    getCurrentUserAction,
    listEventsAction,
    getEventAction,
    cancelEventAction,
    createEventAction,
    findEventsByEmailAction,
    listSchedulingLinksAction,
    createCustomApiCallAction({
      baseUrl: () => SAVVYCAL_BASE_URL,
      auth: savvyCalAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [
    newEventTrigger,
    newCheckoutTrigger,
    newAttendeeEventTrigger,
    newPollResponseTrigger,
    workflowActionTriggeredTrigger,
  ],
});
