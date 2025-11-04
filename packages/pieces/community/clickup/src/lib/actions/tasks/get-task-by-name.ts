import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi, clickupCommon } from '../../common';
import { clickupAuth } from '../../../';

export const getClickupTaskByName = createAction({
  auth: clickupAuth,
  name: 'get_task_by_name',
  description: 'Fetches a task by name in a ClickUp list',
  displayName: 'Get Task by Name',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    task_name: Property.ShortText({
      description: 'The name of the task to find',
      displayName: 'Task Name',
      required: true,
    }),
  },
  async run(configValue) {
    const { list_id, task_name } = configValue.propsValue;
    const accessToken = getAccessTokenOrThrow(configValue.auth);

    let page = 0;
    const pageSize = 100;
    let hasMorePages = true;

    while (hasMorePages) {
      const response = await callClickUpApi(
        HttpMethod.GET,
        `list/${list_id}/task`,
        accessToken,
        undefined,
        { page, limit: pageSize }
      );


      const tasks = response.body.tasks;

      if (!tasks || tasks.length === 0) {
        hasMorePages = false;
        break;
      }

      const matchingTask = tasks.find((task: any) => task.name === task_name);

      if (matchingTask) {
        return matchingTask;
      }

      page++;
    }

    throw new Error(`Task with name "${task_name}" not found in list "${list_id}".`);
  },
});