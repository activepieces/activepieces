import { createPiece, PieceAuth, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { leadStatusChangedTrigger, newContactAddedTrigger, newLeadCreatedTrigger, newTaskCreatedTrigger } from "./lib/triggers";
import { findLeadAction, updateContactAction, createLeadAction, createContactAction, findContactAction, findCompanyAction, updateLeadAction } from "./lib/actions";
import { createCustomApiCallAction } from '@activepieces/pieces-common';

const markdownDescription = `
Please follow [Generate Long Live Token](https://developers.kommo.com/docs/long-lived-token) guide for generating token.

Your Kommo account subdomain (e.g., "mycompany" if your URL is mycompany.kommo.com).

`;

export const kommoAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    subdomain: PieceAuth.SecretText({
      displayName: 'Subdomain',
      required: true,
    }),
    apiToken: PieceAuth.SecretText({
      displayName: 'Token',
      required: true,
    }),
  },
});

export const kommo = createPiece({
  displayName: 'Kommo',
  auth: kommoAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/kommo.png',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.SALES_AND_CRM],
  authors: ['krushnarout', 'kishanprmr'],
  actions: [findLeadAction, updateContactAction, createLeadAction, updateLeadAction, createContactAction, findContactAction, findCompanyAction,
    createCustomApiCallAction({
      auth: kommoAuth,
      baseUrl: (auth) => {
        const authValue = auth as PiecePropValueSchema<typeof kommoAuth>;
        return `https://${authValue.subdomain}.kommo.com/api/v4`
      },
      authMapping: async (auth) => {
        const authValue = auth as PiecePropValueSchema<typeof kommoAuth>;
        return {
          Authorization: `Bearer ${authValue.apiToken}`
        }

      }
    })
  ],
  triggers: [leadStatusChangedTrigger, newContactAddedTrigger, newLeadCreatedTrigger, newTaskCreatedTrigger],
});
