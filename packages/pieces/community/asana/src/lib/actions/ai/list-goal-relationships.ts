import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';

const SUBTYPE_OPTIONS = [
  { label: 'Subgoals', value: 'subgoal' },
  { label: 'Supporting work (projects, tasks, portfolios)', value: 'supporting_work' },
];

export const asanaListGoalRelationshipsAction = createAction({
  auth: asanaAuth,
  name: 'list_goal_relationships',
  classification: 'SEARCH',
  displayName: 'List Goal Relationships',
  description: 'List the subgoals and supporting work linked to an Asana goal (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists what supports a goal: its subgoals and the projects, tasks and portfolios linked as supporting work, each with its contribution weight. Use it before Add Goal Supporting Relationship to avoid linking the same resource twice. Goals need an Advanced or higher Asana plan. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    supported_goal: Property.ShortText({
      displayName: 'Goal GID',
      description: 'Gid of the goal whose supporting relationships to list. Obtain it from List Goals.',
      required: true,
    }),
    resource_subtype: Property.StaticDropdown({
      displayName: 'Relationship Type',
      description: 'Only return this kind of relationship. Leave empty for both.',
      required: false,
      options: { disabled: false, options: SUBTYPE_OPTIONS },
    }),
    limit: asanaProps.limit({ noun: 'relationships' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { supported_goal, resource_subtype, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/goal_relationships',
      operation: 'List Goal Relationships',
      query: {
        supported_goal: supported_goal.trim(),
        resource_subtype: asanaUtils.hasValue(resource_subtype) ? resource_subtype : undefined,
        opt_fields: ASANA_FIELDS.goalRelationship,
      },
      limit,
      offset,
    });
  },
});
