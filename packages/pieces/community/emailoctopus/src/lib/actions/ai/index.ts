import { createContactAction } from './create-contact';
import { createFieldAction } from './create-field';
import { createListAiAction } from './create-list';
import { createTagAction } from './create-tag';
import { deleteContactAction } from './delete-contact';
import { deleteFieldAction } from './delete-field';
import { deleteListAction } from './delete-list';
import { deleteTagAction } from './delete-tag';
import { getCampaignAction } from './get-campaign';
import { getCampaignContactReportAction } from './get-campaign-contact-report';
import { getCampaignLinksReportAction } from './get-campaign-links-report';
import { getCampaignSummaryReportAction } from './get-campaign-summary-report';
import { getContactAction } from './get-contact';
import { getListAction } from './get-list';
import { listCampaignsAction } from './list-campaigns';
import { listContactsAction } from './list-contacts';
import { listListsAction } from './list-lists';
import { listTagsAction } from './list-tags';
import { startAutomationAction } from './start-automation';
import { updateContactAction } from './update-contact';
import { updateContactsBatchAction } from './update-contacts-batch';
import { updateFieldAction } from './update-field';
import { updateListAction } from './update-list';
import { updateTagAction } from './update-tag';
import { upsertContactAction } from './upsert-contact';

export const emailOctopusAiActions = [
	getContactAction,
	listContactsAction,
	createContactAction,
	upsertContactAction,
	updateContactAction,
	deleteContactAction,
	updateContactsBatchAction,
	listListsAction,
	getListAction,
	createListAiAction,
	updateListAction,
	deleteListAction,
	createFieldAction,
	updateFieldAction,
	deleteFieldAction,
	listTagsAction,
	createTagAction,
	updateTagAction,
	deleteTagAction,
	listCampaignsAction,
	getCampaignAction,
	getCampaignContactReportAction,
	getCampaignLinksReportAction,
	getCampaignSummaryReportAction,
	startAutomationAction,
];
