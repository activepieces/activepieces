import { motionAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  BASE_URL,
  projectId,
  statusId,
  userId,
  workspaceId,
} from '../common/props';
import {
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

export const findTask = createAction({
  auth: motionAuth,
  name: 'find-task',
  displayName: 'Find Task',
  description: 'Finds an existing task.',
  props: {
    workspaceId: workspaceId('Workspace ID'),
    includeAllStatuses: Property.Checkbox({
      displayName: 'Include All Statuses',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Task Name',
      required: true,
    }),
    status: statusId,
    assigneeId: userId,
    projectId: projectId,
  },
  async run(context) {
    const {
      workspaceId,
      includeAllStatuses,
      name,
      status,
      assigneeId,
      projectId,
    } = context.propsValue;

    const result = [];

    let nextCursor: string | undefined;

    const qs: QueryParams = {
      name,
      workspaceId,
      includeAllStatuses: includeAllStatuses ? 'true' : 'false',
    };
    if (status) qs['status'] = status;
    if (projectId) qs['projectId'] = projectId;
    if (assigneeId) qs['assigneeId'] = assigneeId;

    do {
      if (nextCursor) {
        qs['cursor'] = nextCursor;
      }

      const response = await httpClient.sendRequest<{
        tasks: { id: string; name: string }[];
        meta: { pageSize: number; nextCursor?: string };
      }>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/tasks`,
        headers: {
          'X-API-Key': context.auth as string,
        },
        queryParams: qs,
      });

      const tasks = response.body.tasks ?? [];
      result.push(...tasks);

      nextCursor = response.body.meta.nextCursor;
    } while (nextCursor);

    return {
      found: result.length > 0,
      result,
    };
  },
});
