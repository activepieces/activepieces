import { setSubscriberCustomFieldsAiAction } from './set-subscriber-custom-fields';
import { listTagsAiAction } from './list-tags';
import { listCustomFieldsAiAction } from './list-custom-fields';
import { listFlowsAiAction } from './list-flows';
import { getPageInfoAiAction } from './get-page-info';

export const manychatAiActions = [
	setSubscriberCustomFieldsAiAction,
	listTagsAiAction,
	listCustomFieldsAiAction,
	listFlowsAiAction,
	getPageInfoAiAction,
];
