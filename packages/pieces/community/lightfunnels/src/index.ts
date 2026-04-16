import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { OAuth2GrantType, PieceCategory } from '@activepieces/shared'
import { cancelOrder } from './lib/actions/cancel-order'
import { createCustomer } from './lib/actions/create-customer'
import { createProduct } from './lib/actions/create-product'
import { getCustomer } from './lib/actions/get-customer'
import { getFunnel } from './lib/actions/get-funnel'
import { getOrder } from './lib/actions/get-order'
import { getProduct } from './lib/actions/get-product'
import { listCustomers } from './lib/actions/list-customers'
import { listOrders } from './lib/actions/list-orders'
import { listProducts } from './lib/actions/list-products'
import { lightfunnelsAuth } from './lib/auth'
import { newLeadTrigger } from './lib/triggers/new-lead'
import { newOrderTrigger } from './lib/triggers/new-order'

export const lightfunnels = createPiece({
    displayName: 'Lightfunnels',
    auth: lightfunnelsAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/lightfunnels.png',
    categories: [PieceCategory.SALES_AND_CRM, PieceCategory.COMMERCE],
    authors: ['aminefrira', 'sanket-a11y'],
    actions: [
        listProducts,
        getProduct,
        createProduct,
        getOrder,
        listOrders,
        cancelOrder,
        createCustomer,
        getCustomer,
        listCustomers,
        getFunnel,
    ],
    triggers: [newOrderTrigger, newLeadTrigger],
})
