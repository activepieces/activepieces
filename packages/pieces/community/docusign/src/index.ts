import { createCustomApiCallAction } from '@activepieces/pieces-common'

import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework'
import { AppConnectionType } from '@activepieces/shared'
import { AxiosError } from 'axios'
import { getDocument } from './lib/actions/get-document'
import { getEnvelope } from './lib/actions/get-envelope'
import { listEnvelopes } from './lib/actions/list-envelopes'
import { docusignAuth } from './lib/auth'
import { createApiClient } from './lib/common'

export type DocusignAuthType = {
    clientId: string
    privateKey: string
    environment: 'demo' | 'www' | 'eu'
    impersonatedUserId: string
    scopes: string
}

export const docusign = createPiece({
    displayName: 'Docusign',
    auth: docusignAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/docusign.png',
    authors: ['AdamSelene'],
    actions: [
        listEnvelopes,
        getEnvelope,
        getDocument,
        createCustomApiCallAction({
            baseUrl: (auth) => {
                if (!auth) return ''
                return `https://${auth.props.environment}.docusign.net/restapi`
            },
            auth: docusignAuth,
            authMapping: async (auth) => {
                const apiClient = await createApiClient(auth)
                return (apiClient as any).defaultHeaders
            },
        }),
    ],
    triggers: [],
})
