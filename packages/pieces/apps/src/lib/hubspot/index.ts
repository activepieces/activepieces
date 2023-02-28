import { createPiece } from '@activepieces/framework';
import { hubSpotListsAddContactAction } from './actions/add-contact-to-list-action';
import { createHubspotContact } from './actions/create-contact.action';
import { hubSpotContactsCreateOrUpdateAction } from './actions/create-or-update-contact-action';
import { hubspotTriggers } from './triggers';

export const hubspot = createPiece({
  name: 'hubspot',
  displayName: "HubSpot",
  logoUrl: 'https://cdn.activepieces.com/pieces/hubspot.png',
  version: '0.0.0',
  authors: ['khaledmashaly', 'kanarelo'],
  actions: [
    createHubspotContact,
    hubSpotContactsCreateOrUpdateAction,
    hubSpotListsAddContactAction,
  ],
  triggers: hubspotTriggers
});
