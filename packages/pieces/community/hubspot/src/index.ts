import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { hubSpotListsAddContactAction } from './lib/actions/add-contact-to-list-action';
import { createHubspotContact } from './lib/actions/create-contact.action';
import { hubSpotContactsCreateOrUpdateAction } from './lib/actions/create-or-update-contact-action';
import { hubSpotGetOwnerByEmailAction } from './lib/actions/search-owner-by-email';
import { newCompanyAdded } from './lib/triggers/new-company-added';
import { newContactAdded } from './lib/triggers/new-contact-added';
import { newDealAdded } from './lib/triggers/new-deal-added';
import { newTaskAdded } from './lib/triggers/new-task-added';
import { newTicketAdded } from './lib/triggers/new-ticket-added';
import { createDealAction } from './lib/actions/create-deal';
import { updateDealAction } from './lib/actions/update-deal';
import { dealStageUpdatedTrigger } from './lib/triggers/deal-stage-updated';

export const hubspotAuth = PieceAuth.OAuth2({
	authUrl: 'https://app.hubspot.com/oauth/authorize',
	tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
	required: true,
	scope: [
		'crm.lists.read',
		'crm.lists.write',
		'crm.objects.contacts.read',
		'crm.objects.contacts.write',
		'crm.objects.owners.read',
		'crm.objects.companies.read',
		'crm.objects.companies.write',
		'crm.objects.deals.read',
		'crm.objects.deals.write',
		'tickets',
	],
});

export const hubspot = createPiece({
	displayName: 'HubSpot',
	description: 'Powerful CRM that offers tools for sales, customer service, and marketing automation.',
	minimumSupportedRelease: '0.5.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/hubspot.png',
	authors: ['Salem-Alaa', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
	categories: [PieceCategory.SALES_AND_CRM],
	auth: hubspotAuth,
	actions: [
		createHubspotContact,
		hubSpotContactsCreateOrUpdateAction,
		hubSpotListsAddContactAction,
		hubSpotGetOwnerByEmailAction,
		createDealAction,
		updateDealAction,
		createCustomApiCallAction({
			baseUrl: () => 'https://api.hubapi.com',
			auth: hubspotAuth,
			authMapping: (auth) => ({
				Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
			}),
		}),
	],
	triggers: [
		newTaskAdded,
		newCompanyAdded,
		newContactAdded,
		newDealAdded,
		newTicketAdded,
		dealStageUpdatedTrigger,
	],
});
