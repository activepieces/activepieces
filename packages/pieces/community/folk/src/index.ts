import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createCompany } from './lib/actions/create-company'
import { createPerson } from './lib/actions/create-person'
import { findCompany } from './lib/actions/find-company'
import { findPerson } from './lib/actions/find-person'
import { getCompany } from './lib/actions/get-company'
import { getPerson } from './lib/actions/get-person'
import { updateCompany } from './lib/actions/update-company'
import { updatePerson } from './lib/actions/update-person'
import { folkAuth } from './lib/common/auth'
import { companyAdded } from './lib/triggers/company-added'
import { companyCustomFieldUpdated } from './lib/triggers/company-custom-field-updated'
import { companyRemoved } from './lib/triggers/company-removed'
import { companyUpdated } from './lib/triggers/company-updated'
import { personAdded } from './lib/triggers/person-added'
import { personCustomFieldUpdated } from './lib/triggers/person-custom-field-updated'
import { personRemoved } from './lib/triggers/person-removed'
import { personUpdated } from './lib/triggers/person-updated'

export const folk = createPiece({
    displayName: 'Folk',
    auth: folkAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/folk.png',
    authors: ['sparkybug'],
    categories: [PieceCategory.SALES_AND_CRM],
    description:
        'Folk is a CRM for building relationships at scale. Manage your contacts, companies, and relationships in one place.',
    actions: [createCompany, updateCompany, createPerson, updatePerson, findCompany, getCompany, findPerson, getPerson],
    triggers: [
        companyAdded,
        companyRemoved,
        companyUpdated,
        companyCustomFieldUpdated,
        personAdded,
        personRemoved,
        personUpdated,
        personCustomFieldUpdated,
    ],
})
