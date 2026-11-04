import { createContactAiAction } from './contacts/create-contact';
import { addTagToContactAction } from './contact-tags/add-tag-to-contact';
import { getTagAction } from './contact-tags/get-tag';
import { listTagsAction } from './contact-tags/list-tags';
import { getCampaignStatsAction } from './campaigns/get-campaign-stats';
import { getCampaignAction } from './campaigns/get-campaign';
import { listCampaignStatsAction } from './campaigns/list-campaign-stats';
import { listCampaignsAction } from './campaigns/list-campaigns';
import { getFormAction } from './forms/get-form';
import { listFormsAction } from './forms/list-forms';
import { getCurrentUserAction } from './users/get-current-user';
import { listCampaignSectionsAction } from './content-library/list-campaign-sections';
import { listCampaignTemplatesAction } from './content-library/list-campaign-templates';
import { getContactFieldAction } from './contact-fields/get-contact-field';
import { listContactFieldsAction } from './contact-fields/list-contact-fields';
import { addContactToListAction } from './lists/add-contact-to-list';
import { getListAction } from './lists/get-list';
import { listListsAction } from './lists/list-lists';
import { getAutomationAction } from './automations/get-automation';
import { listAutomationsAction } from './automations/list-automations';

export const sendfoxAiActions = [
  createContactAiAction,
  addTagToContactAction,
  getTagAction,
  listTagsAction,
  getCampaignStatsAction,
  getCampaignAction,
  listCampaignStatsAction,
  listCampaignsAction,
  getFormAction,
  listFormsAction,
  getCurrentUserAction,
  listCampaignSectionsAction,
  listCampaignTemplatesAction,
  getContactFieldAction,
  listContactFieldsAction,
  addContactToListAction,
  getListAction,
  listListsAction,
  getAutomationAction,
  listAutomationsAction,
];
