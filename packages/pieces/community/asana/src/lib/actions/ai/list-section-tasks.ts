import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaTaskListOutputSchema } from '../../output-schemas';

export const asanaListSectionTasksAction = createAction({
  auth: asanaAuth,
  name: 'list_section_tasks',
  classification: 'SEARCH',
  displayName: 'List Section Tasks',
  description: 'List the tasks in one section of an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the tasks in one section (board column or list heading), optionally only incomplete ones. Asana documents this endpoint for board-view projects; if it returns nothing for a list-view project, use List Project Tasks instead. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTaskListOutputSchema,
  props: {
    section: Property.ShortText({
      displayName: 'Section GID',
      description: 'Gid of the section. Obtain it from List Sections.',
      required: true,
    }),
    completed_since: Property.ShortText({
      displayName: 'Completed Since',
      description: 'Return incomplete tasks plus tasks completed after this ISO 8601 date-time. Use "now" to return only incomplete tasks. Leave empty to return all tasks.',
      required: false,
    }),
    limit: asanaProps.limit({ noun: 'tasks' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { section, completed_since, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: `/sections/${asanaUtils.pathSegment(section)}/tasks`,
      operation: 'List Section Tasks',
      query: {
        completed_since: asanaUtils.hasValue(completed_since) ? String(completed_since).trim() : undefined,
        opt_fields: ASANA_FIELDS.taskList,
      },
      limit,
      offset,
    });
  },
});
