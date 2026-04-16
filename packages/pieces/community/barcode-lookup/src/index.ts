import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { searchByBarcode } from './lib/actions/search-by-barcode'
import { barcodeLookupAuth } from './lib/common/auth'

export const barcodeLookup = createPiece({
    displayName: 'Barcode Lookup',
    auth: barcodeLookupAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/barcode-lookup.png',
    authors: ['sanket-a11y'],
    categories: [PieceCategory.COMMERCE],
    description: 'Lookup product information by barcode number',
    actions: [searchByBarcode],
    triggers: [],
})
