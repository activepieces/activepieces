import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { addSubscriberToListAction } from './lib/actions/add-subscriber-to-list';
import { updateSubscriberDetailsAction } from './lib/actions/update-subscriber-details';
import { unsubscribeSubscriberAction } from './lib/actions/unsubscribe-subscriber';
import { findSubscriberAction } from './lib/actions/find-subscriber';
import { deleteSubscriberAction } from './lib/actions/delete-subscriber';
import { getListSubscribersAction } from './lib/actions/get-list-subscribers';
import { listListsAction } from './lib/actions/list-lists';
import { listClientsAction } from './lib/actions/list-clients';
import { listSmartEmailsAction } from './lib/actions/list-smart-emails';
import { createListAction } from './lib/actions/create-list';
import { listSentCampaignsAction } from './lib/actions/list-sent-campaigns';
import { getCampaignSummaryAction } from './lib/actions/get-campaign-summary';
import { sendSmartEmailAction } from './lib/actions/send-smart-email';
import { addSubscriberJsonAction } from './lib/actions/add-subscriber-json';
import { updateSubscriberJsonAction } from './lib/actions/update-subscriber-json';
import { createDraftCampaignAction } from './lib/actions/create-draft-campaign';
import { sendCampaignAction } from './lib/actions/send-campaign';
import { deleteDraftCampaignAction } from './lib/actions/delete-draft-campaign';
import { getCampaignActivityAction } from './lib/actions/get-campaign-activity';
import { getListStatsAction } from './lib/actions/get-list-stats';
import { suppressEmailsAction } from './lib/actions/suppress-emails';
import { unsuppressEmailAction } from './lib/actions/unsuppress-email';
import { createCustomFieldAction } from './lib/actions/create-custom-field';
import { newCampaignSentTrigger } from './lib/triggers/new-campaign-sent';
import { newSubscriberAddedTrigger } from './lib/triggers/new-subscriber-added';
import { subscriberUnsubscribedTrigger } from './lib/triggers/subscriber-unsubscribed';
import { newClientTrigger } from './lib/triggers/new-client';
import { campaignMonitorAuth } from './lib/auth';

export const campaignMonitor = createPiece({
  displayName: 'Campaign Monitor',
  description:
    'Email marketing platform for delivering exceptional email campaigns.',
  logoUrl: 'https://cdn.activepieces.com/pieces/campaign-monitor.png',
  authors: ['AnkitSharmaOnGithub', 'kishanprmr', 'OdaiAhmed99'],
  minimumSupportedRelease: '0.88.2',
  auth: campaignMonitorAuth,
  actions: [
    addSubscriberToListAction,
    updateSubscriberDetailsAction,
    unsubscribeSubscriberAction,
    findSubscriberAction,
    deleteSubscriberAction,
    getListSubscribersAction,
    listClientsAction,
    listListsAction,
    listSmartEmailsAction,
    createListAction,
    listSentCampaignsAction,
    getCampaignSummaryAction,
    sendSmartEmailAction,
    addSubscriberJsonAction,
    updateSubscriberJsonAction,
    createDraftCampaignAction,
    sendCampaignAction,
    deleteDraftCampaignAction,
    getCampaignActivityAction,
    getListStatsAction,
    suppressEmailsAction,
    unsuppressEmailAction,
    createCustomFieldAction,
  ],
  triggers: [
    newSubscriberAddedTrigger,
    subscriberUnsubscribedTrigger,
    newClientTrigger,
    newCampaignSentTrigger,
  ],
  categories: [PieceCategory.MARKETING],
});
