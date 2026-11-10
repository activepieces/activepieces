import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const listBoardBrands = createAction({
  auth: foreplayCoAuth,
  name: 'list_board_brands',
  classification: 'SEARCH',
  displayName: 'List Board Brands',
  description: 'List the brands saved in a board.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the brands whose ads are saved in one board (board ID from List Boards), up to 10 per page. When hasMore is true call again with offset set to nextOffset. Costs 1 credit per call.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.brandOffsetPage,
  props: {
    boardId: Property.ShortText({ displayName: 'Board ID', required: true }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 10, default 10.', required: false }),
    offset: Property.Number({ displayName: 'Offset', description: 'nextOffset from the previous page.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 10 }) ?? 10;
    const offset = foreplayProps.parseInteger({ value: propsValue.offset, label: 'Offset', min: 0, max: Number.MAX_SAFE_INTEGER }) ?? 0;
    const response = await foreplayClient.request({
      auth,
      path: '/api/board/brands',
      query: { board_id: foreplayProps.foreplayId({ value: propsValue.boardId, label: 'Board ID' }), limit, offset },
    });
    return foreplayMappers.offsetPage({ response, map: foreplayMappers.brand, limit, offset });
  },
});

export { listBoardBrands };
