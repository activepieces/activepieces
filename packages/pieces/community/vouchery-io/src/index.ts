import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { createAVoucher } from './lib/actions/create-a-voucher'
import { createCustomer } from './lib/actions/create-customer'
import { findVoucher } from './lib/actions/find-voucher'
import { voucheryIoAuth } from './lib/common/auth'

export const voucheryIo = createPiece({
    displayName: 'Vouchery',
    auth: voucheryIoAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/vouchery-io.png',
    authors: ['sanket-a11y'],
    description: 'Vouchery is a  voucher and gift card management platform.',
    actions: [
        createAVoucher,
        createCustomer,
        findVoucher,
        createCustomApiCallAction({
            auth: voucheryIoAuth,
            baseUrl: () => 'https://admin.sandbox.vouchery.app/api/v2.1',
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${auth.secret_text}`,
                }
            },
        }),
    ],
    triggers: [],
})
