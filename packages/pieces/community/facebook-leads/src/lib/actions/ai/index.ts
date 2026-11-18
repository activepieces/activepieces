import { createLeadFormAction } from './create-lead-form';
import { getCurrentUserAction } from './get-current-user';
import { getLeadAction } from './get-lead';
import { getLeadFormAction } from './get-lead-form';
import { listLeadFormsAction } from './list-lead-forms';
import { listLeadsAction } from './list-leads';
import { listPagesAction } from './list-pages';
import { updateLeadFormStatusAction } from './update-lead-form-status';

export const facebookLeadsAiActions = [
	getCurrentUserAction,
	listPagesAction,
	listLeadFormsAction,
	getLeadFormAction,
	createLeadFormAction,
	updateLeadFormStatusAction,
	listLeadsAction,
	getLeadAction,
];
