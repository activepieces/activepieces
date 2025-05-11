
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { addedSubscriber } from "./lib/triggers/added-subscriber";
import { unsubscribedSubscriber } from "./lib/triggers/unsubscribed-subscriber";
import { taggedSubscriber } from "./lib/triggers/tagged-subscriber";
import { createSubscriber } from "./lib/actions/create-subscriber";
import { tagSubscriber } from "./lib/actions/tag-subscriber";
import { updateSubscriber } from "./lib/actions/update-subscriber";
import { searchSubscriberByEmail } from "./lib/actions/search-subscriber-by-email";
import { getSubscriberDetails } from "./lib/actions/get-subscriber-details";
import { getCampaignDetails } from "./lib/actions/get-campaign-details";

export const zagomailAuth = PieceAuth.SecretText({
  displayName: 'Application Public Key',
  required: true,
  description:
    'Please provide your application public key by generating one in your zagomail account settings or by directly visiting https://app.zagomail.com/user/api-keys/index.',
});

export const zagomail = createPiece({
  displayName: 'Zagomail',
  description: 'All-in-one email marketing and automation platform',
  logoUrl: 'https://cdn.activepieces.com/pieces/zagomail.png',
  authors: ['gs03dev'],
  auth: zagomailAuth,
  actions: [
    createSubscriber,
    tagSubscriber,
    updateSubscriber,

    searchSubscriberByEmail,

    getSubscriberDetails,
    getCampaignDetails,
  ],
  triggers: [
    addedSubscriber,
    unsubscribedSubscriber,
    taggedSubscriber,
  ],
  categories: [PieceCategory.MARKETING],
});