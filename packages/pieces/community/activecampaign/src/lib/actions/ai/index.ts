import { addContactToAutomationAiAction } from './add-contact-to-automation';
import { addTagToContactAiAction } from './add-tag-to-contact';
import { associateContactWithAccountAction } from './associate-contact-with-account';
import { completeTaskAction } from './complete-task';
import { createAccountAiAction } from './create-account';
import { createDealAiAction } from './create-deal';
import { createNoteAiAction } from './create-note';
import { createOrUpdateContactAiAction } from './create-or-update-contact';
import { createTagAction } from './create-tag';
import { createTaskAiAction } from './create-task';
import { deleteContactAction } from './delete-contact';
import { getContactAction } from './get-contact';
import { getDealAction } from './get-deal';
import { listAccountCustomFieldsAction } from './list-account-custom-fields';
import { listAccountsAction } from './list-accounts';
import { listAutomationsAction } from './list-automations';
import { listContactCustomFieldsAction } from './list-contact-custom-fields';
import { listContactsAction } from './list-contacts';
import { listDealStagesAction } from './list-deal-stages';
import { listDealsAction } from './list-deals';
import { listListsAction } from './list-lists';
import { listPipelinesAction } from './list-pipelines';
import { listTagsAction } from './list-tags';
import { listTaskTypesAction } from './list-task-types';
import { listUsersAction } from './list-users';
import { removeContactFromAutomationAction } from './remove-contact-from-automation';
import { removeTagFromContactAiAction } from './remove-tag-from-contact';
import { subscribeContactToListAction } from './subscribe-contact-to-list';
import { unsubscribeContactFromListAction } from './unsubscribe-contact-from-list';
import { updateAccountAiAction } from './update-account';
import { updateDealAiAction } from './update-deal';

export const activeCampaignAiActions = [
	addContactToAutomationAiAction,
	addTagToContactAiAction,
	associateContactWithAccountAction,
	completeTaskAction,
	createAccountAiAction,
	createDealAiAction,
	createNoteAiAction,
	createOrUpdateContactAiAction,
	createTagAction,
	createTaskAiAction,
	deleteContactAction,
	getContactAction,
	getDealAction,
	listAccountCustomFieldsAction,
	listAccountsAction,
	listAutomationsAction,
	listContactCustomFieldsAction,
	listContactsAction,
	listDealStagesAction,
	listDealsAction,
	listListsAction,
	listPipelinesAction,
	listTagsAction,
	listTaskTypesAction,
	listUsersAction,
	removeContactFromAutomationAction,
	removeTagFromContactAiAction,
	subscribeContactToListAction,
	unsubscribeContactFromListAction,
	updateAccountAiAction,
	updateDealAiAction,
];
