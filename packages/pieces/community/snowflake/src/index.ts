import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { runMultipleQueries } from './lib/actions/run-multiple-queries';
import { runQuery } from './lib/actions/run-query';
import { PieceCategory } from '@activepieces/shared';
import { insertRowAction } from './lib/actions/insert-row';
import { snowflakeAuth } from './lib/auth';

export const snowflake = createPiece({
  displayName: 'Snowflake',
  description: 'Data warehouse built for the cloud',

  auth: snowflakeAuth,
  minimumSupportedRelease: '0.27.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/snowflake.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['AdamSelene', 'abuaboud', 'valentin-mourtialon'],
  actions: [runQuery, runMultipleQueries, insertRowAction],
  triggers: [],
});
