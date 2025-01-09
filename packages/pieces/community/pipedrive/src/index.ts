import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addPerson } from './lib/actions/add-person.action';
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

export const pipedriveAuth = PieceAuth.OAuth2({
	description: '',
	authUrl: 'https://oauth.pipedrive.com/oauth/authorize',
	tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
	required: true,
	scope: ['admin', 'contacts:full', 'users:read', 'deals:full', 'activities:full', 'leads:full'],
});

export const pipedrive = createPiece({
	displayName: 'Pipedrive',
	description: 'Sales CRM and pipeline management software',  

	minimumSupportedRelease: '0.30.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/pipedrive.png',
	categories: [PieceCategory.SALES_AND_CRM],
	auth: pipedriveAuth,
	actions: [
		addPerson,
		createLeadAction,
		createOrganizationAction,
		updateOrganizationAction,
		createPersonAction,
		updatePersonAction,
		createCustomApiCallAction({
			baseUrl: () => 'https://api.pipedrive.com/v1',
			auth: pipedriveAuth,  
			authMapping: async (auth) => ({
				Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
			}),
		}),
	],
	authors: ['ashrafsamhouri', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
	triggers: [
		newPerson,
		newDeal,
		newActivity,
		updatedPerson,
		updatedDeal,
		updatedDealStageTrigger,
		newLeadTrigger,
		newOrganizationTrigger,
		updatedOrganizationTrigger,
	],
});
