import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createContactAction } from './lib/actions/accounts/create-contact';
import { createOrganizationAction } from './lib/actions/accounts/create-organization';
import { deleteContactAction } from './lib/actions/accounts/delete-contact';
import { updateContactAction } from './lib/actions/accounts/update-contact';
import { createOpportunityAction } from './lib/actions/opportunities/create-opportunity';
import { deleteOpportunityAction } from './lib/actions/opportunities/delete-opportunity';
import { updateOpportunityAction } from './lib/actions/opportunities/update-opportunity';
import { createTaskAction } from './lib/actions/tasks/create-task';
import { deleteTaskAction } from './lib/actions/tasks/delete-task';
import { getTaskAction } from './lib/actions/tasks/get-task';
import { updateTaskAction } from './lib/actions/tasks/update-task';

export const flowluAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
  1. Log in to your flowlu account.
  2. Click on your profile-pic(top-right) and navigate to **Portal Settings->API Settings**.
  3. Create new API key with any name and appropriate scope.
  4. Copy API Key to your clipboard and paste it in  **API Key** field
  5. In the Domain field, enter your company from your account URL address. For example, if your account URL address is https://example.flowlu.com, then your domain is **example**.
  `,
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
});

export const flowlu = createPiece({
  displayName: 'Flowlu',
  description: 'Business management software',
  auth: flowluAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/flowlu.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ["kishanprmr","abuaboud"],
  actions: [
    createContactAction,
    updateContactAction,
    deleteContactAction,
    createOrganizationAction,
    createOpportunityAction,
    updateOpportunityAction,
    deleteOpportunityAction,
    createTaskAction,
    updateTaskAction,
    getTaskAction,
    deleteTaskAction,
  ],
  triggers: [],
});
