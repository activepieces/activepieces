
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { addProspectToCampaign } from './lib/actions/add-prospect-to-campaign';
import { addProspectToList } from './lib/actions/add-prospect-to-list';
import { blacklistDomain } from './lib/actions/blacklist-domain';
import { getProspectResponses } from './lib/actions/get-prospect-responses';
import { findProspectByEmail } from './lib/actions/find-prospect-by-email';
import { prospectReplied } from './lib/triggers/prospect-replied';
import { prospectBlacklisted } from './lib/triggers/prospect-blacklisted';
import { prospectOptout } from './lib/triggers/prospect-optout';
import { prospectBounced } from './lib/triggers/prospect-bounced';
import { prospectInvalid } from './lib/triggers/prospect-invalid';
import { prospectAutoreplied } from './lib/triggers/prospect-autoreplied';
import { prospectSaved } from './lib/triggers/prospect-saved';
import { prospectNonresponsive } from './lib/triggers/prospect-nonresponsive';
import { linkClicked } from './lib/triggers/link-clicked';
import { emailOpened } from './lib/triggers/email-opened';
import { prospectInterested } from './lib/triggers/prospect-interested';
import { prospectMaybeLater } from './lib/triggers/prospect-maybe-later';
import { prospectNotInterested } from './lib/triggers/prospect-not-interested';
import { emailSent } from './lib/triggers/email-sent';
import { followupAfterAutoreply } from './lib/triggers/followup-after-autoreply';
import { secondaryReplied } from './lib/triggers/secondary-replied';
import { campaignCompleted } from './lib/triggers/campaign-completed';
import { taskCreated } from './lib/triggers/task-created';
import { taskDone } from './lib/triggers/task-done';
import { taskIgnored } from './lib/triggers/task-ignored';

export const woodpeckerAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To obtain your API key:
1. Log into your Woodpecker account
2. Go to Marketplace (top-right) → Integrations → API keys
3. Click **Create a key**
4. Copy the key and paste it here
`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.woodpecker.co/rest/v2/users',
        headers: {
          'x-api-key': auth,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
});

export const woodpecker = createPiece({
  displayName: 'Woodpecker',
  description: 'Cold email automation tool for sales teams to send personalized outreach campaigns',
  auth: woodpeckerAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/woodpecker.png',
  authors: ['onyedikachi-david'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    addProspectToCampaign,
    addProspectToList,
    blacklistDomain,
    getProspectResponses,
    findProspectByEmail,
    createCustomApiCallAction({
      auth: woodpeckerAuth,
      baseUrl: () => 'https://api.woodpecker.co/rest',
      authMapping: async (auth) => ({
        'x-api-key': auth.secret_text,
      }),
    }),
  ],
  triggers: [
    prospectReplied,
    prospectBlacklisted,
    prospectOptout,
    prospectBounced,
    prospectInvalid,
    prospectAutoreplied,
    prospectSaved,
    prospectNonresponsive,
    linkClicked,
    emailOpened,
    prospectInterested,
    prospectMaybeLater,
    prospectNotInterested,
    emailSent,
    followupAfterAutoreply,
    secondaryReplied,
    campaignCompleted,
    taskCreated,
    taskDone,
    taskIgnored,
  ],
});
    