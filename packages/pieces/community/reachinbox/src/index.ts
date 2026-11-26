import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { addLeads } from './lib/actions/add-leads';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { campaignCompleted } from './lib/triggers/campaign-completed';
import { emailBounced } from './lib/triggers/email-bounced';
import { emailOpened } from './lib/triggers/email-opened';
import { emailSent } from './lib/triggers/email-sent';
import { leadInterested } from './lib/triggers/lead-interested';
import { leadNotInterested } from './lib/triggers/lead-not-interested';
import { replyReceived } from './lib/triggers/reply-received';
import { addBlocklist } from './lib/actions/add-blocklist';
import { addEmail } from './lib/actions/add-email';
import { enableWarmup } from './lib/actions/enable-warmup';
import { getCampaignAnalytics } from './lib/actions/get-campaign-analytics';
import { getSummary } from './lib/actions/get-summary';
import { pauseCampaign } from './lib/actions/pause-campaign';
import { pauseWarmup } from './lib/actions/pause-warmup';
import { removeEmail } from './lib/actions/remove-email';
import { setSchedule } from './lib/actions/set-schedule';
import { startCampaign } from './lib/actions/start-campaign';
import { updateLead } from './lib/actions/update-lead';
import { PieceCategory } from '@activepieces/pieces-framework';
import { reachinboxCommon } from './lib/common';

/**
 * Define the API Key authentication using PieceAuth.SecretText
 */

export const ReachinboxAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'To get your API key:\n1. In ReachInbox, open **Settings** → **Integrations** → **API**.\n2. Copy the key for this workspace.\n\nIt looks like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.',
  required: true,
  validate: async ({ auth }) => {
    // Validate the API key format (UUID pattern: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(auth)) {
      return { valid: true };
    }
    return {
      valid: false,
      error:
        'Invalid API Key. It should follow the UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).',
    };
  },
});

export const reachinbox = createPiece({
  displayName: 'ReachInbox',
  auth: ReachinboxAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/reachinbox.png',
  categories: [PieceCategory.MARKETING],
  authors: ['support@reachinbox.ai', 'ManojKumard', 'Mitrajit'],
  actions: [
    addLeads,
    addBlocklist,
    addEmail,
    enableWarmup,
    getCampaignAnalytics,
    getSummary,
    pauseCampaign,
    pauseWarmup,
    removeEmail,
    setSchedule,
    startCampaign,
    updateLead,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.reachinbox.ai/api/v1/',
      props: {
        url: {
          description: `Full URL, or a path relative to ${reachinboxCommon.baseUrl.replace(/\/$/, '')}`,
          placeholder: '/campaigns/all',
        },
      },
      auth: ReachinboxAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [
    campaignCompleted,
    emailBounced,
    emailOpened,
    emailSent,
    leadInterested,
    leadNotInterested,
    replyReceived,
  ],
});
