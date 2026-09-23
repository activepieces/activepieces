import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createOrUpdateSubscriber } from './lib/actions/create-or-update-subscription';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { triggers } from './triggers/triggers';
import { addSubscriberToGroupAction } from './lib/actions/add-subscriber-to-group';
import { removeSubscriberFromGroupAction } from './lib/actions/remove-subscriber-from-group';
import { findSubscriberAction } from './lib/actions/find-subscriber';
import { createGroupAction } from './lib/actions/create-group';
import { deleteSubscriberAction } from './lib/actions/delete-subscriber';
import { listGroupSubscribersAction } from './lib/actions/list-group-subscribers';
import { listGroupsAction } from './lib/actions/list-groups';
import { listSubscribersAction } from './lib/actions/list-subscribers';
import { unsubscribeSubscriberAction } from './lib/actions/unsubscribe-subscriber';
import { updateSubscriberAction } from './lib/actions/update-subscriber';
import { forgetSubscriberAction } from './lib/actions/forget-subscriber';
import { getSubscriberActivityAction } from './lib/actions/get-subscriber-activity';
import { countSubscribersAction } from './lib/actions/count-subscribers';
import { importSubscribersToGroupAction } from './lib/actions/import-subscribers-to-group';
import { getImportStatusAction } from './lib/actions/get-import-status';
import { findGroupsByNameAction } from './lib/actions/find-groups-by-name';
import { renameGroupAction } from './lib/actions/rename-group';
import { deleteGroupAction } from './lib/actions/delete-group';
import { listSegmentsAction } from './lib/actions/list-segments';
import { listSegmentSubscribersAction } from './lib/actions/list-segment-subscribers';
import { renameSegmentAction } from './lib/actions/rename-segment';
import { deleteSegmentAction } from './lib/actions/delete-segment';
import { listFieldsAction } from './lib/actions/list-fields';
import { createFieldAction } from './lib/actions/create-field';
import { renameFieldAction } from './lib/actions/rename-field';
import { deleteFieldAction } from './lib/actions/delete-field';
import { listAutomationsAction } from './lib/actions/list-automations';
import { getAutomationAction } from './lib/actions/get-automation';
import { getAutomationActivityAction } from './lib/actions/get-automation-activity';
import { createAutomationAction } from './lib/actions/create-automation';
import { deleteAutomationAction } from './lib/actions/delete-automation';
import { listCampaignsAction } from './lib/actions/list-campaigns';
import { getCampaignAction } from './lib/actions/get-campaign';
import { createCampaignDraftAction } from './lib/actions/create-campaign-draft';
import { updateCampaignDraftAction } from './lib/actions/update-campaign-draft';
import { deleteCampaignAction } from './lib/actions/delete-campaign';
import { listCampaignLanguagesAction } from './lib/actions/list-campaign-languages';
import { listFormsAction } from './lib/actions/list-forms';
import { getFormAction } from './lib/actions/get-form';
import { listFormSubscribersAction } from './lib/actions/list-form-subscribers';
import { listWebhooksAction } from './lib/actions/list-webhooks';
import { getWebhookAction } from './lib/actions/get-webhook';
import { createWebhookAction } from './lib/actions/create-webhook';
import { updateWebhookAction } from './lib/actions/update-webhook';
import { deleteWebhookAction } from './lib/actions/delete-webhook';
import { listTimezonesAction } from './lib/actions/list-timezones';
import { mailerLiteAuth } from './lib/auth';

export { mailerLiteAuth };

export const mailerLite = createPiece({
  displayName: 'MailerLite',
  description: 'Email marketing software',

  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/mailer-lite.png',
  categories: [PieceCategory.MARKETING],
  authors: ["Willianwg","kanarelo","kishanprmr","khaledmashaly","abuaboud"],
  auth: mailerLiteAuth,
  actions: [
    addSubscriberToGroupAction,
    createOrUpdateSubscriber,
    findSubscriberAction,
    removeSubscriberFromGroupAction,
    listSubscribersAction,
    unsubscribeSubscriberAction,
    deleteSubscriberAction,
    listGroupsAction,
    createGroupAction,
    listGroupSubscribersAction,
    updateSubscriberAction,
    forgetSubscriberAction,
    getSubscriberActivityAction,
    countSubscribersAction,
    importSubscribersToGroupAction,
    getImportStatusAction,
    findGroupsByNameAction,
    renameGroupAction,
    deleteGroupAction,
    listSegmentsAction,
    listSegmentSubscribersAction,
    renameSegmentAction,
    deleteSegmentAction,
    listFieldsAction,
    createFieldAction,
    renameFieldAction,
    deleteFieldAction,
    listAutomationsAction,
    getAutomationAction,
    getAutomationActivityAction,
    createAutomationAction,
    deleteAutomationAction,
    listCampaignsAction,
    getCampaignAction,
    createCampaignDraftAction,
    updateCampaignDraftAction,
    deleteCampaignAction,
    listCampaignLanguagesAction,
    listFormsAction,
    getFormAction,
    listFormSubscribersAction,
    listWebhooksAction,
    getWebhookAction,
    createWebhookAction,
    updateWebhookAction,
    deleteWebhookAction,
    listTimezonesAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://connect.mailerlite.com/',
      auth: mailerLiteAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers,
});
