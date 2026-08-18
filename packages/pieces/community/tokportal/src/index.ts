import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { tokportalAuth } from './lib/auth';
import { TOKPORTAL_API_URL, TOKPORTAL_CLIENT_HEADER } from './lib/common/client';
import { createBundle } from './lib/actions/create-bundle';
import { getBundle } from './lib/actions/get-bundle';
import { listBundles } from './lib/actions/list-bundles';
import { publishBundle } from './lib/actions/publish-bundle';
import { configureVideo } from './lib/actions/configure-video';
import { publishAllBundleVideos } from './lib/actions/publish-all-bundle-videos';
import { getAccount } from './lib/actions/get-account';
import { listAccounts } from './lib/actions/list-accounts';
import { listAccountBans } from './lib/actions/list-account-bans';
import { getCreditBalance } from './lib/actions/get-credit-balance';
import { getCreditCosts } from './lib/actions/get-credit-costs';
import { uploadImageFromUrl } from './lib/actions/upload-image-from-url';
import { getAnalyticsDashboard } from './lib/actions/get-analytics-dashboard';
import { newWebhookEvent } from './lib/triggers/new-webhook-event';
import { accountDelivered } from './lib/triggers/account-delivered';
import { accountBanned } from './lib/triggers/account-banned';
import { videoPosted } from './lib/triggers/video-posted';

export const tokportal = createPiece({
  displayName: 'TokPortal',
  description:
    'Managed social infrastructure API: real TikTok, Instagram and YouTube accounts created, warmed and operated by human account managers in 16+ countries.',
  auth: tokportalAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://raw.githubusercontent.com/tokportal/tokportal-mcp/main/assets/logo-400.png',
  categories: [PieceCategory.MARKETING],
  authors: ['naybu256'],
  actions: [
    createBundle,
    getBundle,
    listBundles,
    publishBundle,
    configureVideo,
    publishAllBundleVideos,
    getAccount,
    listAccounts,
    listAccountBans,
    getCreditBalance,
    getCreditCosts,
    uploadImageFromUrl,
    getAnalyticsDashboard,
    createCustomApiCallAction({
      auth: tokportalAuth,
      baseUrl: () => TOKPORTAL_API_URL,
      authMapping: async (auth) => ({
        'X-API-Key': auth.secret_text,
        'X-TokPortal-Client': TOKPORTAL_CLIENT_HEADER,
      }),
    }),
  ],
  triggers: [newWebhookEvent, accountDelivered, accountBanned, videoPosted],
});
