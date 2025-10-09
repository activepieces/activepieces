import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { MicrosoftPlannerAuth } from '../common/auth';

export const updateTask = createAction({
  auth:MicrosoftPlannerAuth,
  name: 'update_task',
  displayName: 'Update Planner Task',
  description: 'Modify existing task fields: title, due date, assignments, descriptions.',

  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task you want to update.',
      required: true,
    }),
    etag: Property.ShortText({
      displayName: 'ETag',
      description: 'The ETag value of the task. Required for concurrency. Retrieve it via GET /planner/tasks/{taskId}.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title for the task.',
      required: false,
    }),
    dueDateTime: Property.DateTime({
      displayName: 'Due Date',
      description: 'New due date for the task.',
      required: false,
    }),
    assignments: Property.Json({
      displayName: 'Assignments',
      description: 'Assignments to the task. Example: {"user-id": {"@odata.type": "#microsoft.graph.plannerAssignment", "orderHint": "N9917 U2883!"}}',
      required: false,
    }),
    appliedCategories: Property.Json({
      displayName: 'Applied Categories',
      description: 'Categories applied to the task. Example: {"category1": true, "category2": false}',
      required: false,
    }),
    percentComplete: Property.Number({
      displayName: 'Percent Complete',
      description: 'Completion percentage of the task.',
      required: false,
    }),
  },

  async run(context) {
    const accessToken = (context.auth as { access_token: string }).access_token;
    const { taskId, etag, title, dueDateTime, assignments, appliedCategories, percentComplete } = context.propsValue;

    const payload: Record<string, any> = {};
    if (title) payload['title'] = title;
    if (dueDateTime) payload['dueDateTime'] = dueDateTime;
    if (assignments) payload['assignments'] = assignments;
    if (appliedCategories) payload['appliedCategories'] = appliedCategories;
    if (percentComplete !== undefined) payload['percentComplete'] = percentComplete;

    const response = await makeRequest(
      accessToken,
      HttpMethod.PATCH,
      `/planner/tasks/${taskId}`,
      payload,
      {
        'If-Match': etag,
      }
    );

    return {
      success: true,
      message: `Task with ID ${taskId} updated successfully.`,
      response,
    };
  },
});
