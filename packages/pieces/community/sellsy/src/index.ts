import { createPiece } from '@activepieces/pieces-framework';
import { sellsyAuth } from './lib/common/auth';
import { createContact } from './lib/actions/create-contact';
import { createCompany } from './lib/actions/create-company';
import { createAnnotation } from './lib/actions/create-annotation';
import { createOpportunity } from './lib/actions/create-opportunity';
import { findContact } from './lib/actions/find-contact';
import { findCompany } from './lib/actions/find-company';
import { updateContact } from './lib/actions/update-contact';
import { updateOpportunity } from './lib/actions/update-opportunity';

export const sellsy = createPiece({
  displayName: 'Sellsy',
  auth: sellsyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/sellsy.png',
  authors: [],
  actions: [
    createContact,
    createCompany,
    createAnnotation,
    createOpportunity,
    findContact,
    findCompany,
    updateContact,
    updateOpportunity,
  ],
  triggers: [],
});
