import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
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

import { PieceCategory } from '@activepieces/shared';
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

export const convertkitAuth = PieceAuth.SecretText({
  displayName: 'API Secret',
  description: 'Enter your API Secret key',
  required: true,
});

export const convertkit = createPiece({
  displayName: 'ConvertKit',
  description: 'Email marketing for creators',

  auth: convertkitAuth,
  minimumSupportedRelease: '0.30.0',
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
