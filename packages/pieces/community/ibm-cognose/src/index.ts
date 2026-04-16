import { createCustomApiCallAction, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { copyContentObjectAction } from './lib/actions/copy-content-object'
import { createDataSourceAction } from './lib/actions/create-data-source'
import { deleteDataSourceAction } from './lib/actions/delete-data-source'
import { getContentObjectAction } from './lib/actions/get-content-object'
import { getDataSourceAction } from './lib/actions/get-data-source'
import { moveContentObjectAction } from './lib/actions/move-content-object'
import { updateContentObjectAction } from './lib/actions/update-content-object'
import { updateDataSourceAction } from './lib/actions/update-data-source'
import { ibmCognoseAuth } from './lib/auth'
import { CognosClient } from './lib/common/cognos-client'

export const ibmCognose = createPiece({
    displayName: 'IBM Cognos Analytics',
    description: 'Business intelligence and performance management suite for data analysis and reporting',
    auth: ibmCognoseAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/ibm-cognose.png',
    categories: [PieceCategory.BUSINESS_INTELLIGENCE],
    authors: ['fortunamide', 'onyedikachi-david'],
    actions: [
        createDataSourceAction,
        getDataSourceAction,
        updateDataSourceAction,
        deleteDataSourceAction,
        getContentObjectAction,
        updateContentObjectAction,
        moveContentObjectAction,
        copyContentObjectAction,
        createCustomApiCallAction({
            baseUrl: (auth) => `${(auth as any).baseurl}/api/v1`,
            auth: ibmCognoseAuth,
            authMapping: async (auth: any) => {
                try {
                    const client = new CognosClient(auth.props)
                    await client.createSession()

                    if (client['sessionCookies']) {
                        return {
                            Cookie: client['sessionCookies'],
                        }
                    }

                    return {}
                } catch (error) {
                    throw new Error(
                        `Failed to authenticate: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    )
                }
            },
        }),
    ],
    triggers: [],
})
