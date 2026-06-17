import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { sendrAuth } from './lib/auth';
import { BASE_URL } from './lib/common';

// Actions
import { getUserInfo } from './lib/actions/get-user-info';
import { listSheets } from './lib/actions/list-sheets';
import { getSheet } from './lib/actions/get-sheet';
import { getSheetColumns } from './lib/actions/get-sheet-columns';
import { addRowToSheet } from './lib/actions/add-row-to-sheet';
import { listCampaigns } from './lib/actions/list-campaigns';
import { getCampaign } from './lib/actions/get-campaign';
import { listPageTemplates } from './lib/actions/list-page-templates';
import { getPageTemplateVariables } from './lib/actions/get-page-template-variables';
import { generateSendrPage } from './lib/actions/generate-sendr-page';
import { queueDynamicAudio } from './lib/actions/queue-dynamic-audio';
import { queueVideoGeneration } from './lib/actions/queue-video-generation';
import { listWebhooks } from './lib/actions/list-webhooks';
import { createWebhook } from './lib/actions/create-webhook';
import { updateWebhook } from './lib/actions/update-webhook';
import { deleteWebhook } from './lib/actions/delete-webhook';
import { revealWebhookSecret } from './lib/actions/reveal-webhook-secret';
import { toggleWebhook } from './lib/actions/toggle-webhook';

// Triggers
import { pageRenderCreated } from './lib/triggers/page-render-created';
import { pageRenderUpdated } from './lib/triggers/page-render-updated';
import { contactPageEngagementCreated } from './lib/triggers/contact-page-engagement-created';
import { contactPageEngagementUpdated } from './lib/triggers/contact-page-engagement-updated';

export const sendr = createPiece({
  displayName: 'Sendr',
  description: 'Create personalized landing pages, dynamic audio, video, and manage campaigns with Sendr.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/sendr.png',
  categories: [PieceCategory.MARKETING],
  auth: sendrAuth,
  authors: ['cumonvip1'],
  actions: [
    getUserInfo,
    listSheets,
    getSheet,
    getSheetColumns,
    addRowToSheet,
    listCampaigns,
    getCampaign,
    listPageTemplates,
    getPageTemplateVariables,
    generateSendrPage,
    queueDynamicAudio,
    queueVideoGeneration,
    listWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    revealWebhookSecret,
    toggleWebhook,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: sendrAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [
    pageRenderCreated,
    pageRenderUpdated,
    contactPageEngagementCreated,
    contactPageEngagementUpdated,
  ],
});

export { sendrAuth };
