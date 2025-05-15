import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { leadStatusChangedTrigger, newContactAddedTrigger, newLeadCreatedTrigger, taskCompletedTrigger } from "./lib/triggers";
import { findLeadAction, updateContactAction,  createLeadAction, createContactAction, findContactAction, findCompanyAction } from "./lib/actions";

const markdownDescription = `
You can get your API token from [Kommo settings](https://www.kommo.com/settings/api/).
`;

export const kommoAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    subdomain: PieceAuth.SecretText({
      displayName: 'Subdomain',
      description:
        'Your Kommo account subdomain (e.g., "mycompany" if your URL is mycompany.kommo.com)',
      required: true,
    }),
    apiToken: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'Your Kommo API token',
      required: true,
    }),
  },
});

export const kommo = createPiece({
  displayName: 'Kommo',
  description: 'Kommo CRM integration',
  auth: kommoAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/kommo.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['krushnarout'],
  actions: [findLeadAction , updateContactAction,  createLeadAction, createContactAction, findContactAction, findCompanyAction],
  triggers: [leadStatusChangedTrigger, newContactAddedTrigger, newLeadCreatedTrigger, taskCompletedTrigger],
});
