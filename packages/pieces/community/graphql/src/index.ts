import { PieceAuth, createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { query } from './lib/actions/query'

export const graphql = createPiece({
  displayName: 'GraphQL',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/graphql.svg',
  categories: [PieceCategory.CORE],
  authors: ['mahmuthamet'],
  actions: [query],
  triggers: [],
})
