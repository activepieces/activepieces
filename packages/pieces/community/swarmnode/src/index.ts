import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { executeAgentAction } from './lib/actions/execute-agent'
import { getExecutionAction } from './lib/actions/get-execution'
import { swarmnodeAuth } from './lib/common/auth'
import { BASE_URL } from './lib/common/constants'

export const swarmnode = createPiece({
    displayName: 'SwarmNode',
    auth: swarmnodeAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/swarmnode.png',
    authors: ['kishanprmr'],
    actions: [
        executeAgentAction,
        getExecutionAction,
        createCustomApiCallAction({
            auth: swarmnodeAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${auth.secret_text}`,
                }
            },
        }),
    ],
    triggers: [],
})
