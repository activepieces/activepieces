import { PieceAuth } from '@activepieces/pieces-framework';

export const hubspotAuth = PieceAuth.OAuth2({
	authUrl: 'https://app.hubspot.com/oauth/authorize',
	tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
	required: true,
	scope: [
		'crm.lists.read',
		'crm.lists.write',
		'crm.objects.companies.read',
		'crm.objects.companies.write',
		'crm.objects.contacts.read',
		'crm.objects.contacts.write',
		'crm.objects.custom.read',
		'crm.objects.custom.write',
		'crm.objects.deals.read',
		'crm.objects.deals.write',
		'crm.objects.line_items.read',
		'crm.objects.owners.read',
		'crm.objects.leads.read',
		'crm.objects.leads.write',
		'crm.schemas.companies.read',
		'crm.schemas.contacts.read',
		'crm.schemas.custom.read',
		'crm.schemas.deals.read',
		'crm.schemas.line_items.read',
		'automation',
		'e-commerce',
		'tickets',
		'content',
		'settings.currencies.read',
		'settings.users.read',
		'settings.users.teams.read',
		'files',
		'forms',
		'scheduler.meetings.meeting-link.read'
		// 'business_units_view.read'
	],
});
