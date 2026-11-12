import { createAction, Property } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { LIST_LIMIT_DEFAULT, LIST_LIMIT_MAX } from '../common';
import { youtrackClient } from '../common/client';
import { listAgileBoardsActionOutputSchema } from '../output-schemas';

export const listAgileBoardsAction = createAction({
  auth: youtrackAuth,
  name: 'list_agile_boards',
  classification: 'SEARCH',
  outputSchema: listAgileBoardsActionOutputSchema,
  displayName: 'List Agile Boards',
  description: 'Lists the agile boards you can see, with their projects and current sprint.',
  audience: 'both',
  aiMetadata: {
    description:
      'List agile boards with ID, name, projects, current sprint, whether sprints are enabled, and whether issues are added to sprints manually. Use the board ID for List Sprints, Create Sprint and Add Issue to Sprint. Returns items plus hasMore. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({ displayName: 'Limit', description: `Max boards to return (1-${LIST_LIMIT_MAX}). Default ${LIST_LIMIT_DEFAULT}.`, required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'Number of boards to skip. Default 0.', required: false }),
  },
  async run(context) {
    const { items, hasMore } = await youtrackClient.listPage({
      auth: context.auth,
      path: '/agiles',
      query: { fields: 'id,name,owner(login),projects(id,shortName,name),currentSprint(id,name),sprintsSettings(disableSprints,isExplicit)' },
      limit: youtrackClient.boundedLimit({ value: context.propsValue.limit, fallback: LIST_LIMIT_DEFAULT, max: LIST_LIMIT_MAX }),
      skip: context.propsValue.skip,
      operation: 'list agile boards',
    });
    return {
      items: items.map((b) => {
        const sprint = youtrackClient.recordOf(b['currentSprint']);
        const settings = youtrackClient.recordOf(b['sprintsSettings']);
        return {
          id: b['id'] ?? null,
          name: b['name'] ?? null,
          owner_login: youtrackClient.textOrNull(youtrackClient.recordOf(b['owner'])['login']),
          projects: youtrackClient.records(b['projects']).map((p) => ({ id: p['id'] ?? null, shortName: p['shortName'] ?? null, name: p['name'] ?? null })),
          current_sprint_id: youtrackClient.textOrNull(sprint['id']),
          current_sprint_name: youtrackClient.textOrNull(sprint['name']),
          sprints_enabled: typeof settings['disableSprints'] === 'boolean' ? !settings['disableSprints'] : null,
          manual_sprint_assignment: youtrackClient.booleanOrNull(settings['isExplicit']),
        };
      }),
      hasMore,
    };
  },
});
