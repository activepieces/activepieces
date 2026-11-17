import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkOutputSchemas } from '../../output-schemas';

export const listTasks = createAction({
  auth: folkAuth,
  name: 'list_tasks',
  displayName: 'List Tasks',
  description: 'List Folk tasks, filtered by record, assignee, status or due date.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: folkOutputSchemas.tasks,
  aiMetadata: {
    description:
      'Lists Folk tasks one page at a time (hasMore and nextCursor). Filter by Record ID (tasks on one person, company or object), Assignee User ID, Only Mine, Status (open or done) and due date range. count is the number of items on this page. Read-only.',
    idempotent: true,
  },
  props: {
    entityId: folkAi.idProp({ displayName: 'Record ID', description: 'Only tasks on this person, company or object.', required: false }),
    assigneeUserId: folkAi.idProp({ displayName: 'Assignee User ID', description: 'Only tasks assigned to this user (usr_...).', required: false }),
    onlyMine: Property.Checkbox({ displayName: 'Only Mine', description: 'Only tasks assigned to the API key owner.', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'open: not completed. done: completed. Empty: both.',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Done', value: 'done' },
        ],
      },
    }),
    dueAfter: Property.ShortText({ displayName: 'Due After', description: 'YYYY-MM-DD.', required: false }),
    dueBefore: Property.ShortText({ displayName: 'Due Before', description: 'YYYY-MM-DD.', required: false }),
    ...folkAi.paginationProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const entity = folkFields.textValue({ value: p.entityId });
    const assignee = folkFields.textValue({ value: p.assigneeUserId });
    const query = folkAi.filterQuery({
      filters: [
        { field: 'entity', operator: 'in', value: entity ? folkClient.idSegment({ value: entity, label: 'Record ID' }) : undefined },
        { field: 'assigneeUserId', operator: 'in', value: assignee ? folkClient.idSegment({ value: assignee, label: 'Assignee User ID' }) : undefined },
        ...(p.status === 'open' ? [{ field: 'completedAt', operator: 'empty', value: '' }] : []),
        ...(p.status === 'done' ? [{ field: 'completedAt', operator: 'not_empty', value: '' }] : []),
        { field: 'dueAt', operator: 'gt', value: folkFields.dateValue({ value: p.dueAfter, label: 'Due After' }) },
        { field: 'dueAt', operator: 'lt', value: folkFields.dateValue({ value: p.dueBefore, label: 'Due Before' }) },
      ],
      combinator: 'and',
    });
    const page = await folkClient.listPage<Record<string, unknown>>({
      auth: context.auth,
      path: '/v1/tasks',
      query: { ...query, ...(folkFields.isTrue({ value: p.onlyMine }) ? { onlyAssignedToMe: 'true' } : {}) },
      ...folkAi.paging({ propsValue: p }),
    });
    return folkAi.pageResult({ page });
  },
});
