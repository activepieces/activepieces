import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, OAuth2PropertyValue, PiecePropValueSchema } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createTicketAction } from './lib/actions/create-ticket'
import { findContactAction } from './lib/actions/find-contact'
import { listTicketsAction } from './lib/actions/list-tickets'
import { zohoDeskAuth } from './lib/common/auth'
import { organizationId } from './lib/common/props'

export const piecesZohoDesk = createPiece({
    displayName: 'Zoho Desk',
    description: 'Helpdesk management software',
    auth: zohoDeskAuth,
    categories: [PieceCategory.CUSTOMER_SUPPORT],
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/zoho-desk.png',
    authors: ['volubile', 'kishanprmr'],
    actions: [
        listTicketsAction,
        createTicketAction,
        findContactAction,
        createCustomApiCallAction({
            baseUrl: (auth) => {
                const authValue = auth as PiecePropValueSchema<typeof zohoDeskAuth>
                const location = authValue.props?.['location'] ?? 'zoho.com'
                return `https://desk.${location}/api/v1`
            },
            auth: zohoDeskAuth,
            authMapping: async (auth) => ({
                Authorization: `Zoho-oauthtoken ${(auth as OAuth2PropertyValue).access_token}`,
            }),
            extraProps: {
                orgId: organizationId({
                    displayName: 'Organization ID',
                    description: 'Select organization ID to include in auth headers.',
                    required: false,
                }),
            },
        }),
    ],
    triggers: [],
})
