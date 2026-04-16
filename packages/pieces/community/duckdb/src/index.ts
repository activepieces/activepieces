import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createAndQueryDB } from './lib/actions/create-and-query-db'

export const duckdb = createPiece({
    displayName: 'DuckDB',
    auth: PieceAuth.None(),
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/duckdb.png',
    description: 'Run SQL queries on an in-memory DuckDB database.',
    categories: [PieceCategory.DEVELOPER_TOOLS],
    authors: ['danielpoonwj'],
    actions: [createAndQueryDB],
    triggers: [],
})
