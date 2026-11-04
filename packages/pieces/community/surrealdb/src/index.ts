import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { surrealdbAiActions } from './lib/actions/ai';
import { runQueryAction } from './lib/actions/run-query';
import { surrealdbAuth } from './lib/auth';
import { surrealdbClient } from './lib/common/client';
import { newRowTrigger } from './lib/triggers/new-row';

export const surrealdb = createPiece({
  displayName: 'SurrealDB',
  description: "Multi Model Database",
  minimumSupportedRelease: '0.88.2',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  logoUrl: 'https://cdn.activepieces.com/pieces/surrealdb.jpg',
  authors: ['maarteNNNN'],
  auth: surrealdbAuth,
  actions: [
    runQueryAction,
    ...surrealdbAiActions,
    createCustomApiCallAction({
      auth: surrealdbAuth,
      baseUrl: (auth) => (auth ? surrealdbClient.baseUrl({ auth }) : ''),
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(`${auth.props.username}:${auth.props.password}`).toString('base64')}`,
        'surreal-ns': auth.props.namespace,
        'surreal-db': auth.props.database,
      }),
    }),
  ],
  triggers: [newRowTrigger],
});
