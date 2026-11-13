import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { streakApiCall } from '../common/client';
import { flattenStreakTask } from '../common/flatten';
import { taskListOutputSchema } from '../common/output-schemas';
import { StreakTasksResponse } from '../common/types';

export const listBoxTasksAction = createAction({
  auth: streakAuth,
  name: 'list_box_tasks',
  classification: 'SEARCH',
  displayName: 'List Box Tasks',
  description: 'List the tasks on a box.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the tasks (to-do items) attached to one Streak box, with text, status (NOT_DONE or DONE), due date and assignees. Use to check open follow-ups on a record before creating a new task; requires a box_key from Find Boxes or List Boxes. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: taskListOutputSchema,
  props: {
    box_key: Property.ShortText({
      displayName: 'Box Key',
      description: 'The box key (from Find Boxes or List Boxes).',
      required: true,
    }),
  },
  async run(context) {
    const boxKey = context.propsValue.box_key.trim();
    const response = await streakApiCall<StreakTasksResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/v2/boxes/${encodeURIComponent(boxKey)}/tasks`,
    });
    const body = response.body;
    const tasks = Array.isArray(body) ? body : body?.results ?? [];
    return tasks.map((task) => flattenStreakTask({ task, fallbackBoxKey: boxKey }));
  },
});
