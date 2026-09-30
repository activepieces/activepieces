import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { convertkitAuth } from './lib/auth';
import { assertKitUrl } from './lib/common/custom-api-guard';
import { CONVERTKIT_API_URL } from './lib/common/constants';
import {
  createField,
  deleteField,
  listFields,
  updateField,
} from './lib/actions/custom-fields';
import {
  getSubscriberByEmail,
  getSubscriberById,
  listSubscribers,
  listSubscriberTagsByEmail,
  listTagsBySubscriberId,
  unsubscribeSubscriber,
  updateSubscriber,
} from './lib/actions/subscribers';

import { createWebhook, deleteWebhook } from './lib/actions/webhooks';

import {
  broadcastStats,
  createBroadcast,
  deleteBroadcast,
  getBroadcastById,
  listBroadcasts,
  updateBroadcast,
} from './lib/actions/broadcasts';

import {
  addSubscriberToForm,
  listForms,
  listFormSubscriptions,
} from './lib/actions/forms';

import {
  addSubscriberToSequence,
  listSequences,
  listSubscriptionsToSequence,
} from './lib/actions/sequences';

import {
  createTag,
  listSubscriptionsToATag,
  listTags,
  removeTagFromSubscriberByEmail,
  removeTagFromSubscriberById,
  tagSubscriber,
} from './lib/actions/tags';

import {
  createPurchases,
  createSinglePurchase,
  getPurchaseById,
  listPurchases,
} from './lib/actions/purchases';

import { kitUpdateBroadcast } from './lib/actions/ai/update-broadcast';
import { kitAddSubscriberToSequence } from './lib/actions/ai/add-subscriber-to-sequence';
import { kitListSequenceSubscriptions } from './lib/actions/ai/list-sequence-subscriptions';
import { kitListSubscriberTags } from './lib/actions/ai/list-subscriber-tags';
import { kitListPurchases } from './lib/actions/ai/list-purchases';
import { kitGetPurchase } from './lib/actions/ai/get-purchase';
import { kitGetAccount } from './lib/actions/ai/get-account';
import { kitListSubscribers } from './lib/actions/ai/list-subscribers';
import { kitGetSubscriber } from './lib/actions/ai/get-subscriber';
import { kitUpdateSubscriber } from './lib/actions/ai/update-subscriber';
import { kitUnsubscribeSubscriber } from './lib/actions/ai/unsubscribe-subscriber';
import { kitListTags } from './lib/actions/ai/list-tags';
import { kitCreateTag } from './lib/actions/ai/create-tag';
import { kitTagSubscriber } from './lib/actions/ai/tag-subscriber';
import { kitRemoveTagByEmail } from './lib/actions/ai/remove-tag-by-email';
import { kitRemoveTagFromSubscriber } from './lib/actions/ai/remove-tag-from-subscriber';
import { kitListTagSubscriptions } from './lib/actions/ai/list-tag-subscriptions';
import { kitListForms } from './lib/actions/ai/list-forms';
import { kitAddSubscriberToForm } from './lib/actions/ai/add-subscriber-to-form';
import { kitListFormSubscriptions } from './lib/actions/ai/list-form-subscriptions';
import { kitListSequences } from './lib/actions/ai/list-sequences';
import { kitListBroadcasts } from './lib/actions/ai/list-broadcasts';
import { kitGetBroadcast } from './lib/actions/ai/get-broadcast';
import { kitGetBroadcastStats } from './lib/actions/ai/get-broadcast-stats';
import { kitCreateBroadcast } from './lib/actions/ai/create-broadcast';
import { kitDeleteBroadcast } from './lib/actions/ai/delete-broadcast';
import { kitListCustomFields } from './lib/actions/ai/list-custom-fields';
import { kitCreateCustomField } from './lib/actions/ai/create-custom-field';
import { kitUpdateCustomField } from './lib/actions/ai/update-custom-field';
import { kitDeleteCustomField } from './lib/actions/ai/delete-custom-field';
import { kitCreateWebhook } from './lib/actions/ai/create-webhook';
import { kitDeleteWebhook } from './lib/actions/ai/delete-webhook';
import { kitListWebhooks } from './lib/actions/ai/list-webhooks';
import { PieceCategory } from '@activepieces/pieces-framework';
import {
  addTag,
  formSubscribed,
  linkClicked,
  productPurchased,
  purchaseCreated,
  removeTag,
  sequenceCompleted,
  sequenceSubscribed,
  subscriberActivated,
  subscriberBounced,
  subscriberComplained,
  subscriberUnsubscribed,
} from './lib/triggers';

export const convertkit = createPiece({
  displayName: 'ConvertKit',
  description: 'Email marketing for creators',

  auth: convertkitAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/convertkit.png',
  categories: [PieceCategory.MARKETING],
  authors: ["Gunther-Schulz","kishanprmr","abuaboud"],
  actions: [
    getSubscriberById,
    getSubscriberByEmail,
    listSubscribers,
    updateSubscriber,
    unsubscribeSubscriber,
    listSubscriberTagsByEmail,
    listTagsBySubscriberId,
    createWebhook,
    deleteWebhook,
    listFields,
    createField,
    updateField,
    deleteField,
    listBroadcasts,
    createBroadcast,
    getBroadcastById,
    updateBroadcast,
    deleteBroadcast,
    broadcastStats,
    listForms,
    addSubscriberToForm,
    listFormSubscriptions,
    listSequences,
    addSubscriberToSequence,
    listSubscriptionsToSequence,
    listTags,
    createTag,
    tagSubscriber,
    removeTagFromSubscriberByEmail,
    removeTagFromSubscriberById,
    listSubscriptionsToATag,
    listPurchases,
    getPurchaseById,
    createSinglePurchase,
    createPurchases,
    kitGetAccount,
    kitListSubscribers,
    kitGetSubscriber,
    kitUpdateSubscriber,
    kitUnsubscribeSubscriber,
    kitListTags,
    kitCreateTag,
    kitTagSubscriber,
    kitRemoveTagByEmail,
    kitRemoveTagFromSubscriber,
    kitListTagSubscriptions,
    kitListForms,
    kitAddSubscriberToForm,
    kitListFormSubscriptions,
    kitListSequences,
    kitListBroadcasts,
    kitGetBroadcast,
    kitGetBroadcastStats,
    kitCreateBroadcast,
    kitDeleteBroadcast,
    kitListCustomFields,
    kitCreateCustomField,
    kitUpdateCustomField,
    kitDeleteCustomField,
    kitCreateWebhook,
    kitDeleteWebhook,
    kitListWebhooks,
    kitUpdateBroadcast,
    kitAddSubscriberToSequence,
    kitListSequenceSubscriptions,
    kitListSubscriberTags,
    kitListPurchases,
    kitGetPurchase,
    createCustomApiCallAction({
      baseUrl: () => CONVERTKIT_API_URL,
      auth: convertkitAuth,
      authLocation: 'queryParams',
      authMapping: async (auth, propsValue) => {
        assertKitUrl(propsValue);
        return { api_secret: auth.secret_text };
      },
    }),
  ],
  triggers: [
    addTag,
    removeTag,
    subscriberActivated,
    subscriberUnsubscribed,
    subscriberBounced,
    subscriberComplained,
    formSubscribed,
    sequenceSubscribed,
    sequenceCompleted,
    linkClicked,
    productPurchased,
    purchaseCreated,
  ],
});

export { convertkitAuth };
