import { createPiece } from '@activepieces/pieces-framework'
import { createOrder } from './lib/actions/create-order'
import { findOrder } from './lib/actions/find-order'
import { findShippingLabel } from './lib/actions/find-shipping-label'
import { shippoAuth } from './lib/auth'
import { newOrder } from './lib/triggers/new-order'
import { newShippingLabel } from './lib/triggers/new-shipping-label'

export const shippo = createPiece({
    displayName: 'Shippo',
    description: 'Multi-carrier shipping platform for real-time rates, labels, and tracking',
    auth: shippoAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/shippo.png',
    authors: ['SinghaAnirban005', 'sanket-a11y'],
    actions: [createOrder, findOrder, findShippingLabel],
    triggers: [newShippingLabel, newOrder],
})
