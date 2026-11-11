import { addContactsToListAiAction } from './add-contacts-to-list';
import { addTagsToContactsAiAction } from './add-tags-to-contacts';
import { createContactListAiAction } from './create-contact-list';
import { createEmailCampaignDraftAiAction } from './create-email-campaign-draft';
import { createTagAiAction } from './create-tag';
import { deleteContactAiAction } from './delete-contact';
import { findContactsAiAction } from './find-contacts';
import { getActivityStatusAiAction } from './get-activity-status';
import { getContactAiAction } from './get-contact';
import { getEmailCampaignStatsAiAction } from './get-email-campaign-stats';
import { getEmailCampaignAiAction } from './get-email-campaign';
import { listAccountEmailsAiAction } from './list-account-emails';
import { listContactListsAiAction } from './list-contact-lists';
import { listCustomFieldsAiAction } from './list-custom-fields';
import { listEmailCampaignsAiAction } from './list-email-campaigns';
import { listTagsAiAction } from './list-tags';
import { removeContactsFromListAiAction } from './remove-contacts-from-list';
import { removeTagsFromContactsAiAction } from './remove-tags-from-contacts';
import { sendTestEmailAiAction } from './send-test-email';
import { unsubscribeContactAiAction } from './unsubscribe-contact';
import { updateContactAiAction } from './update-contact';

export const constantContactAiActions = [
  addContactsToListAiAction,
  addTagsToContactsAiAction,
  createContactListAiAction,
  createEmailCampaignDraftAiAction,
  createTagAiAction,
  deleteContactAiAction,
  findContactsAiAction,
  getActivityStatusAiAction,
  getContactAiAction,
  getEmailCampaignStatsAiAction,
  getEmailCampaignAiAction,
  listAccountEmailsAiAction,
  listContactListsAiAction,
  listCustomFieldsAiAction,
  listEmailCampaignsAiAction,
  listTagsAiAction,
  removeContactsFromListAiAction,
  removeTagsFromContactsAiAction,
  sendTestEmailAiAction,
  unsubscribeContactAiAction,
  updateContactAiAction,
];
