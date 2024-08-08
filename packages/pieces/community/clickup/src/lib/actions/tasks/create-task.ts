import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../../';

export const createClickupTask = createAction({
  auth: clickupAuth,
  name: 'create_task',
  description: 'Create a new task in a ClickUp workspace and list',
  displayName: 'Create Task',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    status_id: clickupCommon.status_id(),
    priority_id: clickupCommon.priority_id(),
    assignee_id: clickupCommon.assignee_id(
      false,
      'Assignee Id',
      'ID of assignee for Clickup Task'
    ),
    name: Property.ShortText({
      description: 'The name of task',
      displayName: 'Name',
      required: true,
    }),
    description: Property.LongText({
      description: 'The description of task',
      displayName: 'Description',
      required: false,
    }),
    markdown_description: Property.LongText({
      displayName: 'Markdown Description',
      description: 'The description of task with markdown formatting',
      required: false,
    }),
  },
  async run(configValue) {
    const {
      list_id,
      name,
      description,
      status_id,
      priority_id,
      assignee_id,
      markdown_description,
    } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.POST,
      `list/${list_id}/task`,
      getAccessTokenOrThrow(configValue.auth),
      {
        name,
        description,
        markdown_description,
        status: status_id,
        priority: priority_id,
        assignees: assignee_id,
      }
    );

    return response.body;
  },
});
