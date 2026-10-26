import { addContactToDoNotMailAction } from './add-contact-to-do-not-mail';
import { addContactsToMailingListAction } from './add-contacts-to-mailing-list';
import { addTagToContactAiAction } from './add-tag-to-contact';
import { cloneCampaignAiAction } from './clone-campaign';
import { countContactsAction } from './count-contacts';
import { createCampaignAiAction } from './create-campaign';
import { createCustomFieldAction } from './create-custom-field';
import { createMailingListAction } from './create-mailing-list';
import { createTagAction } from './create-tag';
import { createTopicAction } from './create-topic';
import { deleteCampaignAction } from './delete-campaign';
import { deleteMailingListAction } from './delete-mailing-list';
import { deleteTagAction } from './delete-tag';
import { getCampaignAction } from './get-campaign';
import { getCampaignReportAction } from './get-campaign-report';
import { getLastCampaignReportAction } from './get-last-campaign-report';
import { getMailingListDetailsAction } from './get-mailing-list-details';
import { listCampaignRecipientsAction } from './list-campaign-recipients';
import { listCampaignsAction } from './list-campaigns';
import { listContactFieldsAction } from './list-contact-fields';
import { listContactsAction } from './list-contacts';
import { listMailingListsAction } from './list-mailing-lists';
import { listSentCampaignsAction } from './list-sent-campaigns';
import { listTagsAction } from './list-tags';
import { listTopicsAction } from './list-topics';
import { removeTagFromContactAction } from './remove-tag-from-contact';
import { scheduleCampaignAction } from './schedule-campaign';
import { sendCampaignAiAction } from './send-campaign';
import { subscribeContactAction } from './subscribe-contact';
import { unsubscribeContactAiAction } from './unsubscribe-contact';
import { updateMailingListAction } from './update-mailing-list';

export const zohoCampaignsAiActions = [
	getCampaignAction,
	listCampaignsAction,
	listSentCampaignsAction,
	createCampaignAiAction,
	cloneCampaignAiAction,
	sendCampaignAiAction,
	scheduleCampaignAction,
	deleteCampaignAction,
	getCampaignReportAction,
	getLastCampaignReportAction,
	listCampaignRecipientsAction,
	listMailingListsAction,
	getMailingListDetailsAction,
	createMailingListAction,
	updateMailingListAction,
	deleteMailingListAction,
	countContactsAction,
	listContactsAction,
	subscribeContactAction,
	unsubscribeContactAiAction,
	addContactToDoNotMailAction,
	addContactsToMailingListAction,
	listContactFieldsAction,
	createCustomFieldAction,
	listTagsAction,
	createTagAction,
	addTagToContactAiAction,
	removeTagFromContactAction,
	deleteTagAction,
	listTopicsAction,
	createTopicAction,
];
