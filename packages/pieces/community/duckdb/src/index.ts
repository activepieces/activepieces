import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const duckdb = createPiece({
  displayName: 'DuckDB',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/duckdb.png',
  authors: [],
  actions: [],
  triggers: [],
});
