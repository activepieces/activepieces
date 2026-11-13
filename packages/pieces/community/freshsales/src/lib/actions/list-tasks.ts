import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { listTasksOutputSchema } from '../output-schemas';

export const listTasks = createAction({
  auth: freshsalesAuth,
  name: 'list_tasks',
  displayName: 'List Tasks',
  description: 'List tasks by status (open, overdue, completed...)',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of Freshsales tasks matching a filter (open, due today, due tomorrow, overdue or completed). Returns tasks, page and has_more; call again with Page + 1 while has_more is true.',
    idempotent: true,
  },
  outputSchema: listTasksOutputSchema,
  props: {
    filter: Property.StaticDropdown({
      displayName: 'Filter',
      description: 'Which tasks to list',
      required: true,
      defaultValue: 'open',
      options: {
        disabled: false,
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Due today', value: 'due today' },
          { label: 'Due tomorrow', value: 'due tomorrow' },
          { label: 'Overdue', value: 'overdue' },
          { label: 'Completed', value: 'completed' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const page = context.propsValue.page ?? 1;
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('Page must be a whole number of 1 or more.');
    }
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/api/tasks',
      query: { filter: context.propsValue.filter, page: String(page) },
    });
    const tasks = freshsalesClient
      .readArray({ body: response, key: 'tasks' })
      .filter((item) => freshsalesClient.isRecord(item))
      .map((item) => freshsalesRecords.shapeTargetable(item));
    const meta = freshsalesClient.readMeta(response);
    const hasMore =
      meta.total_pages !== undefined
        ? page < meta.total_pages
        : meta.total !== undefined
        ? page * 25 < meta.total
        : tasks.length === 25;
    return { tasks, page, has_more: hasMore };
  },
});
