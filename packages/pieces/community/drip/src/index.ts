import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { dripAddSubscriberToCampaign } from './lib/actions/add-subscriber-to-campaign.action';
import { dripApplyTagToSubscriber } from './lib/actions/apply-tag-to-subscriber.action';
import { batchUpsertSubscribersAction } from './lib/actions/batch-upsert-subscribers.action';
import { deleteSubscriberAction } from './lib/actions/delete-subscriber.action';
import { findSubscriberAction } from './lib/actions/find-subscriber.action';
import { getBroadcastAction } from './lib/actions/get-broadcast.action';
import { getCampaignAction } from './lib/actions/get-campaign.action';
import { getConversionAction } from './lib/actions/get-conversion.action';
import { getCurrentUserAction } from './lib/actions/get-current-user.action';
import { getFormAction } from './lib/actions/get-form.action';
import { getWorkflowAction } from './lib/actions/get-workflow.action';
import { listAccountsAction } from './lib/actions/list-accounts.action';
import { listBroadcastsAction } from './lib/actions/list-broadcasts.action';
import { listCampaignSubscribersAction } from './lib/actions/list-campaign-subscribers.action';
import { listCampaignsAction } from './lib/actions/list-campaigns.action';
import { listConversionsAction } from './lib/actions/list-conversions.action';
import { listCustomFieldsAction } from './lib/actions/list-custom-fields.action';
import { listEventActionsAction } from './lib/actions/list-event-actions.action';
import { listFormsAction } from './lib/actions/list-forms.action';
import { listSubscriberCampaignsAction } from './lib/actions/list-subscriber-campaigns.action';
import { listSubscribersAction } from './lib/actions/list-subscribers.action';
import { listTagsAction } from './lib/actions/list-tags.action';
import { listWorkflowsAction } from './lib/actions/list-workflows.action';
import { recordCartAction } from './lib/actions/record-cart.action';
import { recordEventAction } from './lib/actions/record-event.action';
import { recordOrderAction } from './lib/actions/record-order.action';
import { removeFromCampaignAction } from './lib/actions/remove-from-campaign.action';
import { removeFromWorkflowAction } from './lib/actions/remove-from-workflow.action';
import { removeTagAction } from './lib/actions/remove-tag.action';
import { startWorkflowAction } from './lib/actions/start-workflow.action';
import { unsubscribeSubscriberAction } from './lib/actions/unsubscribe-subscriber.action';
import { dripUpsertSubscriberAction } from './lib/actions/upsert-subscriber.action';
import { applyTagAction } from './lib/actions/ai/apply-tag.action';
import { createOrUpdateSubscriberAction } from './lib/actions/ai/create-or-update-subscriber.action';
import { subscribeToCampaignAction } from './lib/actions/ai/subscribe-to-campaign.action';
import { dripCompletedCampaignEvent } from './lib/trigger/completed-campaign.trigger';
import { dripCustomEventPerformedEvent } from './lib/trigger/custom-event-performed.trigger';
import { dripEmailClickedEvent } from './lib/trigger/email-clicked.trigger';
import { dripNewSubscriberEvent } from './lib/trigger/new-subscriber.trigger';
import { dripTagAppliedEvent } from './lib/trigger/new-tag.trigger';
import { dripRemovedFromCampaignEvent } from './lib/trigger/removed-from-campaign.trigger';
import { dripSubscribedToCampaignEvent } from './lib/trigger/subscribed-to-campaign.trigger';
import { dripSubscriberDeletedEvent } from './lib/trigger/subscriber-deleted.trigger';
import { dripSubscriberUnsubscribedEvent } from './lib/trigger/subscriber-unsubscribed.trigger';
import { dripTagRemovedEvent } from './lib/trigger/tag-removed.trigger';
import { dripAuth } from './lib/auth';
import { dripApi } from './lib/common/client';

export const drip = createPiece({
  displayName: 'Drip',
  description: 'Email and SMS marketing automation for e-commerce',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/drip.png',
  authors: ['kishanprmr', 'MoShizzle', 'AbdulTheActivePiecer', 'khaledmashaly', 'abuaboud'],
  categories: [PieceCategory.MARKETING],
  auth: dripAuth,
  actions: [
    dripApplyTagToSubscriber,
    dripAddSubscriberToCampaign,
    dripUpsertSubscriberAction,
    batchUpsertSubscribersAction,
    deleteSubscriberAction,
    findSubscriberAction,
    getBroadcastAction,
    getCampaignAction,
    getConversionAction,
    getCurrentUserAction,
    getFormAction,
    getWorkflowAction,
    listAccountsAction,
    listBroadcastsAction,
    listCampaignSubscribersAction,
    listCampaignsAction,
    listConversionsAction,
    listCustomFieldsAction,
    listEventActionsAction,
    listFormsAction,
    listSubscriberCampaignsAction,
    listSubscribersAction,
    listTagsAction,
    listWorkflowsAction,
    recordCartAction,
    recordEventAction,
    recordOrderAction,
    removeFromCampaignAction,
    removeFromWorkflowAction,
    removeTagAction,
    startWorkflowAction,
    unsubscribeSubscriberAction,
    applyTagAction,
    createOrUpdateSubscriberAction,
    subscribeToCampaignAction,
    createCustomApiCallAction({
      baseUrl: () => `${dripApi.DRIP_ORIGIN}/v2/`,
      auth: dripAuth,
      authMapping: async (auth) => ({
        Authorization: dripApi.authHeader(auth.secret_text),
      }),
    }),
  ],
  triggers: [
    dripNewSubscriberEvent,
    dripTagAppliedEvent,
    dripCompletedCampaignEvent,
    dripCustomEventPerformedEvent,
    dripEmailClickedEvent,
    dripRemovedFromCampaignEvent,
    dripSubscribedToCampaignEvent,
    dripSubscriberDeletedEvent,
    dripSubscriberUnsubscribedEvent,
    dripTagRemovedEvent,
  ],
});
