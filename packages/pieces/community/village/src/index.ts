import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { enrichCompanyBasic } from './lib/actions/companies/enrich-company-basic'
import { enrichCompanyBasicBulk } from './lib/actions/companies/enrich-company-basic-bulk'
// Company actions
import { getCompanyPaths } from './lib/actions/companies/get-company-paths'
import { sortCompanies } from './lib/actions/companies/sort-companies'
import { enrichEmail } from './lib/actions/people/enrich-email'
import { enrichEmailsBulk } from './lib/actions/people/enrich-emails-bulk'
import { enrichPersonBasic } from './lib/actions/people/enrich-person-basic'
import { enrichPersonBasicBulk } from './lib/actions/people/enrich-person-basic-bulk'
// People actions
import { getPersonPaths } from './lib/actions/people/get-person-paths'
import { sortPeople } from './lib/actions/people/sort-people'

export const villageAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
    description: 'Your Village API Key',
})

export const village = createPiece({
    displayName: 'Village',
    description: 'The Social Capital API',
    auth: villageAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/village.png',
    categories: [PieceCategory.PRODUCTIVITY, PieceCategory.SALES_AND_CRM],
    authors: ['rafaelmuttoni'],
    actions: [
        // People actions
        getPersonPaths,
        sortPeople,
        enrichEmail,
        enrichPersonBasic,
        enrichPersonBasicBulk,
        enrichEmailsBulk,
        // Company actions
        getCompanyPaths,
        sortCompanies,
        enrichCompanyBasic,
        enrichCompanyBasicBulk,
    ],
    triggers: [],
})
