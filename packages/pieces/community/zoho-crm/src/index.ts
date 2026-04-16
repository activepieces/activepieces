import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, OAuth2PropertyValue, PieceAuth, Property } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { readFile } from './lib/actions/read-file'
import { zohoCrmAuth } from './lib/auth'
import { newContact } from './lib/triggers/new-contact'

export const zohoCrm = createPiece({
    displayName: 'Zoho CRM',
    description: 'Customer relationship management software',

    logoUrl: 'https://cdn.activepieces.com/pieces/zoho-crm.png',
    minimumSupportedRelease: '0.30.0',
    categories: [PieceCategory.SALES_AND_CRM],
    authors: ['kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'ikus060'],
    auth: zohoCrmAuth,
    actions: [
        readFile,
        createCustomApiCallAction({
            baseUrl: (auth) => {
                const data = (auth as OAuth2PropertyValue).data
                return data && data['api_domain'] ? `${data['api_domain']}/crm/v3` : ''
            },

            auth: zohoCrmAuth,
            authMapping: async (auth) => ({
                Authorization: `Zoho-oauthtoken ${(auth as OAuth2PropertyValue).access_token}`,
            }),
        }),
    ],
    triggers: [newContact],
})
