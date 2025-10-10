import { createAction, Property } from '@activepieces/pieces-framework';
import { MicrosoftPlannerAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { bucketIdDropdown, planIdDropdown } from '../common/dropdown';

export const createTask = createAction({
  auth: MicrosoftPlannerAuth,
  name: 'create_task',
  displayName: 'Create Planner Task',
  description: 'Creates a new task in a specified Planner plan and bucket',

  props: {
    planId:planIdDropdown,
    bucketId: bucketIdDropdown,
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
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });
    
    const response = await client
      .api(`/planner/tasks`)
      .post(payload);

    return response;
  },
});
