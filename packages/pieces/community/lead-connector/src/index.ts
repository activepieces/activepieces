import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { baseUrl, getContacts, leadConnectorHeaders } from './lib/common';

import { PieceCategory } from '@activepieces/shared';
import { addContactToCampaignAction } from './lib/actions/add-contact-to-campaign';
import { addContactToWorkflowAction } from './lib/actions/add-contact-to-workflow';
import { addNoteToContactAction } from './lib/actions/add-note-to-contact';
import { createContact } from './lib/actions/create-contact';
import { createOpportunityAction } from './lib/actions/create-opportunity';
import { createTaskAction } from './lib/actions/create-task';
import { searchContactsAction } from './lib/actions/search-contacts';
import { updateContactAction } from './lib/actions/update-contact';
import { updateOpportunityAction } from './lib/actions/update-opportunity';
import { updateTaskAction } from './lib/actions/update-task';
import { contactUpdated } from './lib/triggers/contact-updated';
import { newContact } from './lib/triggers/new-contact';
import { newFormSubmission } from './lib/triggers/new-form-submission';
import { newOpportunity } from './lib/triggers/new-opportunity';

const markdownDescription = `
1. Go to the [Marketplace](https://marketplace.gohighlevel.com/) and sign up for a developer account.
2. Navigate to **My Apps** and click on **Create App**.
3. Provide app name.Then select **Private** as App Type, **Sub-Account** as Distribution Type. Click **Create App** Button.
4. Add following scopes.
   - campaigns.readonly
   - contacts.write
   - contacts.readonly
   - locations.readonly
   - locations/tags.readonly
   - locations/tags.write
   - opportunities.readonly
   - opportunities.write
   - users.readonly
   - workflows.readonly
   - forms.readonly
5. Add redirect URLs.
6. Create new Client key with valid name.Copy Client ID and Client Secret.
`;

export const leadConnectorAuth = PieceAuth.OAuth2({
  authUrl: 'https://marketplace.gohighlevel.com/oauth/chooselocation',
  tokenUrl: 'https://services.leadconnectorhq.com/oauth/token',
  scope: [
    'campaigns.readonly',
    'contacts.write',
    'contacts.readonly',
    'locations.readonly',
    'locations/tags.readonly',
    'locations/tags.write',
    'opportunities.readonly',
    'opportunities.write',
    'users.readonly',
    'workflows.readonly',
    'forms.readonly',
  ],
  description: markdownDescription,
  required: true,
  async validate({ auth }) {
    try {
      await getContacts(auth);

      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key.',
      };
    }
  },
});

export const leadConnector = createPiece({
  displayName: 'LeadConnector',
  description: 'Lead Connector - Go High Level',
  auth: leadConnectorAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/lead-connector.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['kishanprmr', 'MoShizzle', 'abuaboud'],
  actions: [
    createContact,
    updateContactAction,
    addContactToCampaignAction,
    addContactToWorkflowAction,
    addNoteToContactAction,
    searchContactsAction,
    createOpportunityAction,
    updateOpportunityAction,
    createTaskAction,
    updateTaskAction,
    createCustomApiCallAction({
      baseUrl: () => baseUrl,
      auth: leadConnectorAuth,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
          ...leadConnectorHeaders,
        };
      },
    }),
  ],
  triggers: [newContact, contactUpdated, newFormSubmission, newOpportunity],
});
