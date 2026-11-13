import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearConnection, LinearIssueNode, linearMappers } from '../../common/mappers';
import { atomicProps } from './common';
import { ISSUES_LIST_QUERY } from './queries';
import { atomicIssuesPageOutputSchema } from './output-schemas';

export const linearIssuesListAtomic = createAction({
  auth: linearAuth,
  name: 'linear_issues_list',
  classification: 'SEARCH',
  displayName: 'List Issues (AI)',
  description: 'List issues with structured filters (team, project, assignee, status, label, cycle, priority, updated since).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Linear issues matching structured filters (team, project, assignee, status or status type, label, cycle, priority, updated since), one page at a time with a cursor. Use for exact filtering such as "open issues assigned to X in team Y"; use Search Issues for free-text matching. All filters are combined with AND; with no filter it lists every issue you can access. Read-only and idempotent. labels_complete is false when Linear did not return every label page; label_ids and label_names then hold only the labels read.',
    idempotent: true,
  },
  props: {
    team_id: Property.ShortText({ displayName: 'Team ID', description: 'Only issues of this team (UUID from List Teams).', required: false }),
    project_id: Property.ShortText({ displayName: 'Project ID', description: 'Only issues in this project (UUID from List Projects).', required: false }),
    assignee_id: Property.ShortText({ displayName: 'Assignee ID', description: 'Only issues assigned to this user (UUID from List Users).', required: false }),
    state_id: Property.ShortText({ displayName: 'Status ID', description: 'Only issues in this workflow state (UUID from List Workflow States).', required: false }),
    state_type: Property.StaticDropdown({
      displayName: 'Status Type',
      description: 'Only issues whose status is of this type, across teams.',
      required: false,
      options: {
        options: [
          { label: 'Triage', value: 'triage' },
          { label: 'Backlog', value: 'backlog' },
          { label: 'Unstarted (Todo)', value: 'unstarted' },
          { label: 'Started (In progress)', value: 'started' },
          { label: 'Completed', value: 'completed' },
          { label: 'Canceled', value: 'canceled' },
        ],
      },
    }),
    label_id: Property.ShortText({ displayName: 'Label ID', description: 'Only issues that have this label (UUID from List Issue Labels).', required: false }),
    cycle_id: Property.ShortText({ displayName: 'Cycle ID', description: 'Only issues in this cycle (UUID from List Cycles).', required: false }),
    priority: Property.Number({ displayName: 'Priority', description: 'Only issues with this priority: 0 none, 1 urgent, 2 high, 3 medium, 4 low.', required: false }),
    updated_after: Property.ShortText({ displayName: 'Updated After', description: 'Only issues updated after this ISO 8601 time, for example 2026-09-01T00:00:00Z.', required: false }),
    include_archived: Property.Checkbox({ displayName: 'Include Archived', required: false, defaultValue: false }),
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Sort order. Default: newest created first.',
      required: false,
      options: {
        options: [
          { label: 'Created at', value: 'createdAt' },
          { label: 'Updated at', value: 'updatedAt' },
        ],
      },
    }),
    limit: atomicProps.limitProp({ fallback: 50, max: 250 }),
    cursor: atomicProps.cursorProp(),
  },
  outputSchema: atomicIssuesPageOutputSchema,
  async run({ auth, propsValue }) {
    const updatedAfter = propsValue.updated_after?.trim();
    if (updatedAfter && Number.isNaN(Date.parse(updatedAfter))) {
      throw new Error('Updated After must be an ISO 8601 date-time, for example 2026-09-01T00:00:00Z.');
    }
    const priority = atomicProps.priorityValue(propsValue.priority);
    const filter = linearGraphql.definedOnly({
      team: atomicProps.idFilter(propsValue.team_id),
      project: atomicProps.idFilter(propsValue.project_id),
      assignee: atomicProps.idFilter(propsValue.assignee_id),
      state: stateFilter({ stateId: propsValue.state_id, stateType: propsValue.state_type }),
      labels: propsValue.label_id ? { some: { id: { eq: propsValue.label_id } } } : undefined,
      cycle: atomicProps.idFilter(propsValue.cycle_id),
      priority: priority === undefined ? undefined : { eq: priority },
      updatedAt: updatedAfter ? { gt: updatedAfter } : undefined,
    });
    const data = await linearGraphql.request<{ issues: LinearConnection<LinearIssueNode> }>({
      auth,
      query: ISSUES_LIST_QUERY,
      variables: {
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        first: linearGraphql.clampLimit({ value: propsValue.limit, fallback: 50, max: 250 }),
        after: propsValue.cursor || undefined,
        includeArchived: propsValue.include_archived === true,
        orderBy: propsValue.order_by || undefined,
      },
    });
    const nodes = await linearGraphql.withAllIssuesLabels({ auth, issues: data.issues.nodes });
    return linearMappers.toPage({ connection: { ...data.issues, nodes }, map: linearMappers.flattenIssue });
  },
});

function stateFilter({ stateId, stateType }: { stateId: string | undefined; stateType: string | undefined }) {
  const filter = linearGraphql.definedOnly({
    id: stateId ? { eq: stateId } : undefined,
    type: stateType ? { eq: stateType } : undefined,
  });
  return Object.keys(filter).length > 0 ? filter : undefined;
}
