import { createAction } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';

const listBoards = createAction({
  auth: foreplayCoAuth,
  name: 'list_boards',
  classification: 'SEARCH',
  displayName: 'List Boards',
  description: 'List all boards in your Foreplay account.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns every board the Foreplay user or team can access (ID, name, description, created date) in one call. Use the board ID with List Board Ads or List Board Brands. Costs 1 credit per call.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.boardList,
  props: {},
  async run({ auth }) {
    const response = await foreplayClient.request({ auth, path: '/api/boards' });
    const items = foreplayMappers.listOf(response.body).map(foreplayMappers.board);
    return { items, count: items.length, ...foreplayMappers.credits(response) };
  },
});

export { listBoards };
