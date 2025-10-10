import { createAction, Property } from '@activepieces/pieces-framework';
import { MicrosoftPlannerAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { planIdDropdown, taskIdDropdown } from '../common/dropdown';

export const updateTask = createAction({
  auth: MicrosoftPlannerAuth,
  name: 'update_task',
  displayName: 'Update Planner Task',
  description: 'Modify existing task fields: title, due date, assignments, descriptions.',

  props: {
    planId: planIdDropdown,
    taskId: taskIdDropdown,
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
  
    const { taskId, etag, title, dueDateTime, assignments, appliedCategories, percentComplete } = context.propsValue;
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () =>
          Promise.resolve((context.auth as { access_token: string }).access_token),
      },
    });

    const payload: Record<string, any> = {};
    if (title) payload['title'] = title;
    if (dueDateTime) payload['dueDateTime'] = dueDateTime;
    if (assignments) payload['assignments'] = assignments;
    if (appliedCategories) payload['appliedCategories'] = appliedCategories;
    if (percentComplete !== undefined) payload['percentComplete'] = percentComplete;


    const response = await client
      .api(`/planner/tasks/${taskId}`)
      .header('If-Match', etag)
      .patch(payload);

    return response;
  },
});
