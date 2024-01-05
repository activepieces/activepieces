import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { hubSpotListsAddContactAction } from './lib/actions/add-contact-to-list-action';
import { createHubspotContact } from './lib/actions/create-contact.action';
import { hubSpotContactsCreateOrUpdateAction } from './lib/actions/create-or-update-contact-action';
import { hubSpotGetOwnerByEmailAction } from './lib/actions/search-owner-by-email';
import { newCompanyAdded } from './lib/triggers/new-company-added';
import { newContactAdded } from './lib/triggers/new-contact-added';
import { newDealAdded } from './lib/triggers/new-deal-added';
import { newTaskAdded } from './lib/triggers/new-task-added';
import { newTicketAdded } from './lib/triggers/new-ticket-added';

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
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/hubspot.png',
  authors: ['khaledmashaly', 'MoShizzle', 'Salem-Alaa', 'kishanprmr'],
  auth: hubspotAuth,
  actions: [
    createHubspotContact,
    hubSpotContactsCreateOrUpdateAction,
    hubSpotListsAddContactAction,
    hubSpotGetOwnerByEmailAction,
  ],
  triggers: [
    newTaskAdded,
    newCompanyAdded,
    newContactAdded,
    newDealAdded,
    newTicketAdded,
  ],
});
