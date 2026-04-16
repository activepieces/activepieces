import { HttpMethod } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { sardisAuth } from '../auth'
import { sardisApiCall, sardisCommon } from '../common'

export const checkBalanceAction = createAction({
    name: 'check_balance',
    auth: sardisAuth,
    displayName: 'Check Balance',
    description: 'Check wallet balance and spending limits.',
    props: {
        walletId: sardisCommon.walletId,
        token: sardisCommon.token,
        chain: sardisCommon.chain,
    },
    async run(context) {
        const { walletId, token, chain } = context.propsValue
        return sardisApiCall(
            context.auth.secret_text,
            HttpMethod.GET,
            `/api/v2/wallets/${walletId}/balance`,
            undefined,
            { chain: chain ?? 'base', token: token ?? 'USDC' },
        )
    },
})
