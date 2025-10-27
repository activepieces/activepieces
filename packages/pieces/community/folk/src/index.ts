import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { folkAuth } from './lib/common/common';
import { createCompanyAction } from './lib/actions/create-company';
import { updateCompanyAction } from './lib/actions/update-company';
import { createPersonAction } from './lib/actions/create-person';
import { updatePersonAction } from './lib/actions/update-person';
import { findCompanyAction } from './lib/actions/find-a-company';
import { getCompanyAction } from './lib/actions/get-a-company';
import { findPersonAction } from './lib/actions/find-a-person';
import { getPersonAction } from './lib/actions/get-a-person';
import { companyAddedTrigger } from './lib/triggers/company-added';
import { companyRemovedTrigger } from './lib/triggers/company-removed';
import { companyUpdatedTrigger } from './lib/triggers/company-updated';
import { personAddedTrigger } from './lib/triggers/person-added';
import { personRemovedTrigger } from './lib/triggers/person-removed';
import { personUpdatedTrigger } from './lib/triggers/person-updated';
import { companyCustomFieldUpdatedTrigger } from './lib/triggers/company-custom-field-updated';
import { personCustomFieldUpdatedTrigger } from './lib/triggers/person-custom-field-updated';




export const folk = createPiece({
  displayName: 'Folk',
  description: 'Next-generation CRM for managing relationships, contacts, and communication',
  auth: folkAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/folk.png',
  authors: ['Ani-4x'],
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.PRODUCTIVITY],
  triggers: [
    companyAddedTrigger,
    companyRemovedTrigger,
    companyCustomFieldUpdatedTrigger,
    companyUpdatedTrigger,
    personAddedTrigger,
    personRemovedTrigger,
    personCustomFieldUpdatedTrigger,
    personUpdatedTrigger,
  ],
  actions: [
    createCompanyAction,
    updateCompanyAction,
    createPersonAction,
    updatePersonAction,
    findCompanyAction,
    getCompanyAction,
    findPersonAction,
    getPersonAction,
  ],
});