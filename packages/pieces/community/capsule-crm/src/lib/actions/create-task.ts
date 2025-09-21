import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common';
import { makeApiCall, API_ENDPOINTS } from '../common';

export const createTaskAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates a new task in Capsule CRM.',
  props: {
    description: Property.LongText({
      displayName: 'Task Description',
      description: 'Description of the task',
      required: true,
    }),
    partyId: Property.Number({
      displayName: 'Contact ID',
      description: 'ID of the contact associated with this task',
      required: false,
    }),
    opportunityId: Property.Number({
      displayName: 'Opportunity ID',
      description: 'ID of the opportunity associated with this task',
      required: false,
    }),
    projectId: Property.Number({
      displayName: 'Project ID',
      description: 'ID of the project (case) associated with this task',
      required: false,
    }),
    categoryId: Property.Number({
      displayName: 'Category ID',
      description: 'ID of the task category',
      required: false,
    }),
    dueOn: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date in YYYY-MM-DD format',
      required: false,
    }),
    dueTime: Property.ShortText({
      displayName: 'Due Time',
      description: 'Due time in HH:MM:SS format',
      required: false,
    }),
    ownerId: Property.Number({
      displayName: 'Owner ID',
      description: 'ID of the user who owns this task',
      required: false,
    }),
  },
  async run(context) {
    const {
      description,
      partyId,
      opportunityId,
      projectId,
      categoryId,
      dueOn,
      dueTime,
      ownerId
    } = context.propsValue;

    // Build the task object
    const task: any = {
      description: description,
    };

    if (partyId) task.party = { id: partyId };
    if (opportunityId) task.opportunity = { id: opportunityId };
    if (projectId) task.kase = { id: projectId }; // Note: API uses 'kase' for projects
    if (categoryId) task.category = { id: categoryId };
    if (dueOn) task.dueOn = dueOn;
    if (dueTime) task.dueTime = dueTime;
    if (ownerId) task.owner = { id: ownerId };

    const requestBody = { task };

    const response = await makeApiCall(
      context.auth,
      API_ENDPOINTS.TASKS,
      'POST',
      requestBody
    );

    if (response.status >= 200 && response.status < 300) {
      return response.body;
    } else {
      throw new Error(`Failed to create task: ${response.status} ${response.body?.message || ''}`);
    }
  },
});