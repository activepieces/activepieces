import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { newActivity } from './lib/trigger/new-activity';
import { newDeal } from './lib/trigger/new-deal';
import { newPerson } from './lib/trigger/new-person';
import { updatedDeal } from './lib/trigger/updated-deal';
import { updatedPerson } from './lib/trigger/updated-person';
import { newLeadTrigger } from './lib/trigger/new-lead';
import { newOrganizationTrigger } from './lib/trigger/new-organization';
import { updatedOrganizationTrigger } from './lib/trigger/updated-organization';
import { updatedDealStageTrigger } from './lib/trigger/updated-deal-stage';
import { createPersonAction } from './lib/actions/create-person';
import { updatePersonAction } from './lib/actions/update-person';
import { createOrganizationAction } from './lib/actions/create-organization';
import { updateOrganizationAction } from './lib/actions/update-organization';
import { createLeadAction } from './lib/actions/create-lead';
import { updateLeadAction } from './lib/actions/update-lead';
import { createDealAction } from './lib/actions/create-deal';
import { updateDealAction } from './lib/actions/update-deal';
import { createProductAction } from './lib/actions/create-product';
import { addProductToDealAction } from './lib/actions/add-product-to-deal';
import { addLabelToPersonAction } from './lib/actions/add-label-to-person';
import { createActivityAction } from './lib/actions/create-activity';
import { updateActivityAction } from './lib/actions/update-activity';
import { attachFileAction } from './lib/actions/attach-file';
import { addFollowerAction } from './lib/actions/add-follower';
import { createNoteAction } from './lib/actions/create-note';
import { getNoteAction } from './lib/actions/get-note';
import { findUserAction } from './lib/actions/find-user';
import { findProductAction } from './lib/actions/find-product';
import { organizationMatchingFilterTrigger } from './lib/trigger/organization-matching-filter';
import { personMatchingFilterTrigger } from './lib/trigger/person-matching-filter';
import { activityMatchingFilterTrigger } from './lib/trigger/activity-matching-filter';
import { dealMatchingFilterTrigger } from './lib/trigger/deal-matching-filter';
import { newNoteTrigger } from './lib/trigger/new-note';
import { findDealsAssociatedWithPersonAction } from './lib/actions/find-deals-associated-with-person';
import { findProductsAction } from './lib/actions/find-products';
import { getProductAction } from './lib/actions/get-product';
import { findNotesAction } from './lib/actions/find-notes';
import { findOrganizationAction } from './lib/actions/find-organization';
import { findPersonAction } from './lib/actions/find-person';
import { findDealAction } from './lib/actions/find-deal';
import { findActivityAction } from './lib/actions/find-activity';
import { updateProductAction } from './lib/actions/update-product';
import { findLeadAction } from './lib/actions/find-leads';
import { getDealAction } from './lib/actions/get-deal';
import { listDealsAction } from './lib/actions/list-deals';
import { searchDealsAction } from './lib/actions/search-deals';
import { deleteDealAction } from './lib/actions/delete-deal';
import { listDealProductsAction } from './lib/actions/list-deal-products';
import { removeProductFromDealAction } from './lib/actions/remove-product-from-deal';
import { getPersonAction } from './lib/actions/get-person';
import { listPersonsAction } from './lib/actions/list-persons';
import { searchPersonsAction } from './lib/actions/search-persons';
import { deletePersonAction } from './lib/actions/delete-person';
import { getOrganizationAction } from './lib/actions/get-organization';
import { listOrganizationsAction } from './lib/actions/list-organizations';
import { searchOrganizationsAction } from './lib/actions/search-organizations';
import { deleteOrganizationAction } from './lib/actions/delete-organization';
import { getActivityAction } from './lib/actions/get-activity';
import { listActivitiesAction } from './lib/actions/list-activities';
import { deleteActivityAction } from './lib/actions/delete-activity';
import { getLeadAction } from './lib/actions/get-lead';
import { deleteLeadAction } from './lib/actions/delete-lead';
import { convertLeadToDealAction } from './lib/actions/convert-lead-to-deal';
import { getLeadConversionStatusAction } from './lib/actions/get-lead-conversion-status';
import { updateNoteAction } from './lib/actions/update-note';
import { deleteNoteAction } from './lib/actions/delete-note';
import { deleteProductAction } from './lib/actions/delete-product';
import { listPipelinesAction } from './lib/actions/list-pipelines';
import { listStagesAction } from './lib/actions/list-stages';
import { listActivityTypesAction } from './lib/actions/list-activity-types';
import { listUsersAction } from './lib/actions/list-users';
import { getCurrentUserAction } from './lib/actions/get-current-user';
import { addGoalAction } from './lib/actions/add-goal';
import { updateGoalAction } from './lib/actions/update-goal';
import { deleteGoalAction } from './lib/actions/delete-goal';
import { findGoalsAction } from './lib/actions/find-goals';
import { getGoalResultAction } from './lib/actions/get-goal-result';
import { addCallLogAction } from './lib/actions/add-call-log';
import { getCallLogAction } from './lib/actions/get-call-log';
import { listCallLogsAction } from './lib/actions/list-call-logs';
import { deleteCallLogAction } from './lib/actions/delete-call-log';
import { mergeDealsAction } from './lib/actions/merge-deals';
import { mergePersonsAction } from './lib/actions/merge-persons';
import { mergeOrganizationsAction } from './lib/actions/merge-organizations';
import { pipedriveAuth } from './lib/auth';

export const pipedrive = createPiece({
	displayName: 'Pipedrive',
	description: 'Sales CRM and pipeline management software',

	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/pipedrive.png',
	categories: [PieceCategory.SALES_AND_CRM],
	auth: pipedriveAuth,
	actions: [
		addFollowerAction,
		getNoteAction,
		createNoteAction,
		addLabelToPersonAction,
		addProductToDealAction,
		attachFileAction,
		createActivityAction,
		updateActivityAction,
		createDealAction,
		updateDealAction,
		createLeadAction,
		updateLeadAction,
		createOrganizationAction,
		updateOrganizationAction,
		createPersonAction,
		updatePersonAction,
		createProductAction,
		updateProductAction,
		findDealsAssociatedWithPersonAction,
		findProductAction,
		findProductsAction,
		findNotesAction,
		getProductAction,
		findOrganizationAction,
		findPersonAction,
		findDealAction,
		findActivityAction,
		findUserAction,
		findLeadAction,
		getDealAction,
		listDealsAction,
		searchDealsAction,
		deleteDealAction,
		listDealProductsAction,
		removeProductFromDealAction,
		getPersonAction,
		listPersonsAction,
		searchPersonsAction,
		deletePersonAction,
		getOrganizationAction,
		listOrganizationsAction,
		searchOrganizationsAction,
		deleteOrganizationAction,
		getActivityAction,
		listActivitiesAction,
		deleteActivityAction,
		getLeadAction,
		deleteLeadAction,
		convertLeadToDealAction,
		getLeadConversionStatusAction,
		updateNoteAction,
		deleteNoteAction,
		deleteProductAction,
		listPipelinesAction,
		listStagesAction,
		listActivityTypesAction,
		listUsersAction,
		getCurrentUserAction,
		addGoalAction,
		updateGoalAction,
		deleteGoalAction,
		findGoalsAction,
		getGoalResultAction,
		addCallLogAction,
		getCallLogAction,
		listCallLogsAction,
		deleteCallLogAction,
		mergeDealsAction,
		mergePersonsAction,
		mergeOrganizationsAction,
		createCustomApiCallAction({
			baseUrl: (auth) => {
				const apiDomain = auth?.data?.['api_domain'];
				return typeof apiDomain === 'string' && apiDomain.length > 0
					? `${apiDomain}/api/v2`
					: 'https://api.pipedrive.com/api/v2';
			},
			auth: pipedriveAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
			}),
		}),
	],
	authors: ['ashrafsamhouri', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'leocottaz', 'Anmol-Gup'],
	triggers: [
		newPerson,
		newDeal,
		newActivity,
		newNoteTrigger,
		updatedPerson,
		updatedDeal,
		updatedDealStageTrigger,
		newLeadTrigger,
		newOrganizationTrigger,
		updatedOrganizationTrigger,
		activityMatchingFilterTrigger,
		dealMatchingFilterTrigger,
		personMatchingFilterTrigger,
		organizationMatchingFilterTrigger,
	],
});
