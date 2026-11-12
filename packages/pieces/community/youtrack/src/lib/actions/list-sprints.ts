import { createAction, Property } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { boardDropdown, LIST_LIMIT_DEFAULT, LIST_LIMIT_MAX, SPRINT_FIELDS, sprintRow } from '../common';
import { youtrackClient } from '../common/client';
import { listSprintsActionOutputSchema } from '../output-schemas';

export const listSprintsAction = createAction({
  auth: youtrackAuth,
  name: 'list_sprints',
  classification: 'SEARCH',
  outputSchema: listSprintsActionOutputSchema,
  displayName: 'List Sprints',
  description: 'Lists the sprints of an agile board.',
  audience: 'both',
  aiMetadata: {
    description:
      'List the sprints of one agile board (board ID from List Agile Boards) with ID, name, goal, start and finish (epoch ms), archived flag and unresolved issue count. Use the sprint ID for Add Issue to Sprint. Returns items plus hasMore. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    board: boardDropdown,
    limit: Property.Number({ displayName: 'Limit', description: `Max sprints to return (1-${LIST_LIMIT_MAX}). Default ${LIST_LIMIT_DEFAULT}.`, required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'Number of sprints to skip. Default 0.', required: false }),
  },
  async run(context) {
    const { items, hasMore } = await youtrackClient.listPage({
      auth: context.auth,
      path: `/agiles/${youtrackClient.segment({ value: context.propsValue.board, label: 'Agile Board' })}/sprints`,
      query: { fields: SPRINT_FIELDS },
      limit: youtrackClient.boundedLimit({ value: context.propsValue.limit, fallback: LIST_LIMIT_DEFAULT, max: LIST_LIMIT_MAX }),
      skip: context.propsValue.skip,
      operation: 'list sprints',
    });
    return { items: items.map(sprintRow), hasMore };
  },
});
