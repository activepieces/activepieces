import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../auth';
import { foreplayClient } from '../common/client';
import { foreplayMappers } from '../common/mappers';
import { foreplayOutputSchemas } from '../common/output-schemas';
import { foreplayProps } from '../common/props';

const findBoards = createAction({
  auth: foreplayCoAuth,
  name: 'findBoards',
  classification: 'SEARCH',
  displayName: 'Find Boards',
  description: 'Get the boards of your Foreplay account. Leave Limit empty to get all boards.',
  audience: 'human',
  aiMetadata: {
    description: 'List the boards of the Foreplay account; with no limit it returns every board. Returns raw board objects (id, name, description). Costs 1 credit per call.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.rawBoards,
  props: {
    offset: Property.Number({ displayName: 'Offset', description: 'Boards to skip (only used when Limit is set).', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Boards per request. Leave empty for all boards.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 10_000 });
    const offset = foreplayProps.parseInteger({ value: propsValue.offset, label: 'Offset', min: 0, max: Number.MAX_SAFE_INTEGER });
    const response = await foreplayClient.request({
      auth,
      path: '/api/boards',
      query: limit === undefined ? {} : { limit, offset },
    });
    return foreplayMappers.listOf(response.body);
  },
});

export { findBoards };
