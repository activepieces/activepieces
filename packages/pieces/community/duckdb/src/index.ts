import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

import { createAndQueryDB } from './lib/actions/create-and-query-db';

export const duckdb = createPiece({
  displayName: 'DuckDB',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/duckdb.png',
  authors: [],
  actions: [createAndQueryDB],
  triggers: [],
});
