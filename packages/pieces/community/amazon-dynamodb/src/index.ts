import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { dynamodbAuth } from './lib/auth';
import { listTablesAction } from './lib/actions/list-tables';
import { describeTableAction } from './lib/actions/describe-table';
import { getItemAction } from './lib/actions/get-item';
import { putItemAction } from './lib/actions/put-item';
import { updateItemAction } from './lib/actions/update-item';
import { deleteItemAction } from './lib/actions/delete-item';
import { queryItemsAction } from './lib/actions/query-items';
import { scanItemsAction } from './lib/actions/scan-items';

export const amazonDynamodb = createPiece({
  displayName: 'Amazon DynamoDB',
  description: 'Read and write items in Amazon DynamoDB tables.',
  logoUrl: 'https://cdn.activepieces.com/pieces/amazon-dynamodb.png',
  minimumSupportedRelease: '0.30.0',
  authors: ['jayanthedam'],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: dynamodbAuth,
  actions: [
    listTablesAction,
    describeTableAction,
    getItemAction,
    putItemAction,
    updateItemAction,
    deleteItemAction,
    queryItemsAction,
    scanItemsAction,
  ],
  triggers: [],
});

export default amazonDynamodb;
