import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { leadStatusChangedTrigger, newContactAddedTrigger, newLeadCreatedTrigger, newTaskCreatedTrigger } from "./lib/triggers";
import { findLeadAction, updateContactAction, createLeadAction, createContactAction, findContactAction, findCompanyAction, updateLeadAction } from "./lib/actions";
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { kommoAuth } from './lib/auth';

export const kommo = createPiece({
  displayName: 'Kommo',
  minimumSupportedRelease: '0.88.2',
  auth: kommoAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/kommo.png',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.SALES_AND_CRM],
  authors: ['krushnarout', 'kishanprmr'],
  actions: [findLeadAction, updateContactAction, createLeadAction, updateLeadAction, createContactAction, findContactAction, findCompanyAction,
    createCustomApiCallAction({
      auth: kommoAuth,
      props: {
        url: {
          description: "Full URL, or a path relative to your Kommo account's /api/v4 address.",
          placeholder: '/leads?limit=10',
        },
      },
      baseUrl: (auth) => {
        if (!auth) {
          return '';
        }
        const authValue = auth.props;
        return `https://${authValue.subdomain}.kommo.com/api/v4`
      },
      authMapping: async (auth) => {
        const authValue = auth.props;
        return {
          Authorization: `Bearer ${authValue.apiToken}`
        }

      }
    })
  ],
  triggers: [leadStatusChangedTrigger, newContactAddedTrigger, newLeadCreatedTrigger, newTaskCreatedTrigger],
});
