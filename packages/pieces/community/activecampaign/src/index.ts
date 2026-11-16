import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { newDealAddedOrUpdatedTrigger } from './lib/triggers/new-deal-added-or-updated';
import { createAccountAction } from './lib/actions/accounts/create-account';
import { updateAccountAction } from './lib/actions/accounts/update-account';
import { subscribeOrUnsubscribeContactFromListAction } from './lib/actions/contacts/subscribe-or-unsubscribe-contact-from-list';
import { createContactAction } from './lib/actions/contacts/create-contact';
import { updateContactAction } from './lib/actions/contacts/update-contact';
import { addContactToAccountAction } from './lib/actions/contacts/add-contact-to-account';
import { addTagToContactAction } from './lib/actions/contacts/add-tag-to-contact';
import { findContactAction } from './lib/actions/contacts/find-contact';
import { removeTagFromContactAction } from './lib/actions/contacts/remove-tag-from-contact';
import { addContactToAutomationAction } from './lib/actions/contacts/add-contact-to-automation';
import { createDealAction } from './lib/actions/deals/create-deal';
import { updateDealAction } from './lib/actions/deals/update-deal';
import { createNoteAction } from './lib/actions/notes/create-note';
import { createTaskAction } from './lib/actions/tasks/create-task';
import { activeCampaignAiActions } from './lib/actions/ai';
import { newDealNoteTrigger } from './lib/triggers/new-deal-note';
import { newDealTaskTrigger } from './lib/triggers/new-deal-task';
import { dealTaskCompletedTrigger } from './lib/triggers/deal-task-completed';
import { newtagAddedOrRemovedFromContactTrigger } from './lib/triggers/tag-added-or-removed-from-contact';
import { newOrUpdatedAccountTrigger } from './lib/triggers/new-or-updated-account';
import { newContactNoteTrigger } from './lib/triggers/new-contact-note';
import { newContactTaskTrigger } from './lib/triggers/new-contact-task';
import { updatedContactTrigger } from './lib/triggers/updated-contact';
import { campaignLinkClickedTrigger } from './lib/triggers/campaign-link-clicked';
import { newCampaignBounceTrigger } from './lib/triggers/new-campaign-bounce';
import { newContactSubscribedTrigger } from './lib/triggers/new-contact-subscribed';
import { contactUnsubscribedTrigger } from './lib/triggers/contact-unsubscribed';
import { activeCampaignAuth } from './lib/auth';

export const activecampaign = createPiece({
  displayName: 'ActiveCampaign',
  description:
    'Email marketing, marketing automation, and CRM tools you need to create incredible customer experiences.',
  auth: activeCampaignAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/activecampaign.png',
  categories: [PieceCategory.MARKETING, PieceCategory.SALES_AND_CRM],
  authors: ["kishanprmr","abuaboud","OdaiAhmed99"],
  actions: [
    addContactToAccountAction,
    addTagToContactAction,
    createAccountAction,
    createContactAction,
    updateAccountAction,
    updateContactAction,
    subscribeOrUnsubscribeContactFromListAction,
    findContactAction,
    removeTagFromContactAction,
    addContactToAutomationAction,
    createDealAction,
    updateDealAction,
    createNoteAction,
    createTaskAction,
    ...activeCampaignAiActions,
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
    campaignLinkClickedTrigger,
    newCampaignBounceTrigger,
    newContactSubscribedTrigger,
    contactUnsubscribedTrigger,
  ],
});
