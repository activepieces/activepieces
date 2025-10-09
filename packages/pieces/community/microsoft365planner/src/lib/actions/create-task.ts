import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { MicrosoftPlannerAuth } from '../common/auth';

export const createTask = createAction({
  auth:MicrosoftPlannerAuth,
  name: 'create_task',
  displayName: 'Create Planner Task',
  description: 'Creates a new task in a specified Planner plan and bucket',

  props: {
    planId: Property.ShortText({
      displayName: 'Plan ID',
      description: 'ID of the Planner plan in which the task will be created',
      required: true,
    }),
    bucketId: Property.ShortText({
      displayName: 'Bucket ID',
      description: 'ID of the bucket in the plan',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the task',
      required: true,
    }),
    dueDateTime: Property.DateTime({
      displayName: 'Due Date & Time',
      description: 'Due date and time for the task (optional)',
      required: false,
    }),
    assignments: Property.Json({
      displayName: 'Assignments',
      description: `Assignment object mapping user IDs to plannerAssignment objects. E.g. { "user-id": { "@odata.type": "#microsoft.graph.plannerAssignment", "orderHint": " !"} }`,
      required: false,
    }),
    orderHint: Property.ShortText({
      displayName: 'Order Hint',
      description: 'Order hint string (optional)',
      required: false,
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description: 'Priority of the task (0–10, lower means higher priority)',
      required: false,
    }),
    appliedCategories: Property.Json({
      displayName: 'Applied Categories',
      description: `Category flags mapping. E.g. { "category1": true, "category2": false }`,
      required: false,
    }),
  },

  async run(context) {
    const accessToken = (context.auth as { access_token: string }).access_token;

    const {
      planId,
      bucketId,
      title,
      dueDateTime,
      assignments,
      orderHint,
      priority,
      appliedCategories,
    } = context.propsValue;

    const payload: any = {
      planId,
      bucketId,
      title,
    };

    if (dueDateTime) {
      payload.dueDateTime = dueDateTime;
    }
    if (assignments) {
      payload.assignments = assignments;
    }
    if (orderHint) {
      payload.orderHint = orderHint;
    }
    if (priority !== undefined && priority !== null) {
      payload.priority = priority;
    }
    if (appliedCategories) {
      payload.appliedCategories = appliedCategories;
    }

    const response = await makeRequest(
      accessToken,
      HttpMethod.POST,
      '/planner/tasks',
      payload
    );

    return response;
  },
});
