import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { runQueryAction } from './lib/actions/run-query';
import { surrealdbAuth } from './lib/auth';
import { newRowTrigger } from './lib/triggers/new-row';

export const surrealdb = createPiece({
  displayName: 'SurrealDB',
  description: "Multi Model Database",
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  logoUrl: 'https://cdn.activepieces.com/pieces/surrealdb.jpg',
  authors: ['maarteNNNN'],
  auth: surrealdbAuth,
  actions: [runQueryAction],
  triggers: [newRowTrigger],
});
