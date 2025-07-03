import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { newDealAddedOrUpdatedTrigger } from './lib/triggers/new-deal-added-or-updated';
import { createAccountAction } from './lib/actions/accounts/create-account';
import { updateAccountAction } from './lib/actions/accounts/update-account';
import { subscribeOrUnsubscribeContactFromListAction } from './lib/actions/contacts/subscribe-or-unsubscribe-contact-from-list';
import { createContactAction } from './lib/actions/contacts/create-contact';
import { updateContactAction } from './lib/actions/contacts/update-contact';
import { addContactToAccountAction } from './lib/actions/contacts/add-contact-to-account';
import { addTagToContactAction } from './lib/actions/contacts/add-tag-to-contact';
import { makeClient } from './lib/common';
import { newDealNoteTrigger } from './lib/triggers/new-deal-note';
import { newDealTaskTrigger } from './lib/triggers/new-deal-task';
import { dealTaskCompletedTrigger } from './lib/triggers/deal-task-completed';
import { newtagAddedOrRemovedFromContactTrigger } from './lib/triggers/tag-added-or-removed-from-contact';
import { newOrUpdatedAccountTrigger } from './lib/triggers/new-or-updated-account';
import { newContactNoteTrigger } from './lib/triggers/new-contact-note';
import { newContactTaskTrigger } from './lib/triggers/new-contact-task';
import { updatedContactTrigger } from './lib/triggers/updated-contact';

const authGuide = `
To obtain your ActiveCampaign API URL and Key, follow these steps:

1. Log in to your ActiveCampaign account.
2. Navigate to **Settings->Developer** section.
3. Under **API Access** ,you'll find your API URL and Key.
`;

export const activeCampaignAuth = PieceAuth.CustomAuth({
  required: true,
  description: authGuide,
  props: {
    apiUrl: Property.ShortText({
      displayName: 'API URL',
      required: true,
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = makeClient(auth);
      await client.authenticate();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API credentials',
      };
    }
  },
});

export const activecampaign = createPiece({
  displayName: 'ActiveCampaign',
  description:
    'Email marketing, marketing automation, and CRM tools you need to create incredible customer experiences.',
  auth: activeCampaignAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/activecampaign.png',
  categories: [PieceCategory.MARKETING, PieceCategory.SALES_AND_CRM],
  authors: ["kishanprmr","abuaboud"],
  actions: [
    addContactToAccountAction,
    addTagToContactAction,
    createAccountAction,
    createContactAction,
    updateAccountAction,
    updateContactAction,
    subscribeOrUnsubscribeContactFromListAction,
  ],
  triggers: [
    dealTaskCompletedTrigger,
    newContactNoteTrigger,
    newContactTaskTrigger,
    newDealAddedOrUpdatedTrigger,
    newOrUpdatedAccountTrigger,
    newDealNoteTrigger,
    newDealTaskTrigger,
    newtagAddedOrRemovedFromContactTrigger,
    updatedContactTrigger,
  ],
});
