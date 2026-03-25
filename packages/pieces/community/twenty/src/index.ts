import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { twentyAuth } from './lib/auth';
import { createContact } from './lib/actions/create-contact';
import { createCompany } from './lib/actions/create-company';
import { createOpportunity } from './lib/actions/create-opportunity';
import { findPerson } from './lib/actions/find-person';
import { findCompany } from './lib/actions/find-company';
import { updatePerson } from './lib/actions/update-person';
import { updateCompany } from './lib/actions/update-company';
import { newPerson } from './lib/triggers/new-person';
import { newCompany } from './lib/triggers/new-company';

export { twentyAuth };

export const twenty = createPiece({
  displayName: 'Twenty',
  description: 'Open-source CRM platform.',
  auth: twentyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/twenty.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['Akash5908'],
  actions: [
    createContact,
    createCompany,
    createOpportunity,
    findPerson,
    findCompany,
    updatePerson,
    updateCompany,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        (auth as unknown as { props: { base_url: string } }).props.base_url.replace(/\/$/, ''),
      auth: twentyAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as unknown as { props: { api_key: string } }).props.api_key}`,
      }),
    }),
  ],
  triggers: [newPerson, newCompany],
});
