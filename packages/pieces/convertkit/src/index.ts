import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  getSubscriberById,
  getSubscriberByEmail,
  listSubscribers,
  updateSubscriber,
  unsubscribeSubscriber,
  listSubscriberTagsByEmail,
  listTagsBySubscriberId,
} from './lib/actions/subscribers';
import {
  listFields,
  createField,
  updateField,
  deleteField,
} from './lib/actions/custom-fields';

import { createWebhook, deleteWebhook } from './lib/actions/webhooks';

import {
  listBroadcasts,
  createBroadcast,
  getBroadcastById,
  updateBroadcast,
  deleteBroadcast,
  broadcastStats,
} from './lib/actions/broadcasts';

import {
  listForms,
  addSubscriberToForm,
  listFormSubscriptions,
} from './lib/actions/forms';

import {
  listSequences,
  addSubscriberToSequence,
  listSupscriptionsToSequence,
} from './lib/actions/sequences';

import {
  listTags,
  createTag,
  tagSubscriber,
  removeTagFromSubscriberByEmail,
  removeTagFromSubscriberById,
  listSubscriptionsToATag,
} from './lib/actions/tags';

import {
  listPurchases,
  getPurchaseById,
  createSinglePurchase,
  createPurchases,
} from './lib/actions/purchases';

import {
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
} from './lib/triggers';

export const convertkitAuth = PieceAuth.SecretText({
  displayName: 'API Secret',
  description: 'Enter your API Secret key',
  required: true,
});

export const convertkit = createPiece({
  displayName: 'ConvertKit',
  auth: convertkitAuth,
  minimumSupportedRelease: '0.5.0',
  logoUrl:
    'https://cdn.activepieces.com/pieces/convertkit.png',
  authors: [],
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
    listSupscriptionsToSequence,
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
