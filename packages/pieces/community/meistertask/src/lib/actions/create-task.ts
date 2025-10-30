import { meistertaskAuth } from '../../index';
import { meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const createTask = createAction({
  auth: meistertaskAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates a new task',
  props: {
    section_id: Property.ShortText({
      displayName: 'Section ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Task Name',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
    assigned_to_id: Property.ShortText({
      displayName: 'Assigned To ID',
      required: false,
    }),
    due: Property.ShortText({
      displayName: 'Due Date',
      description: 'ISO 8601 format (e.g., 2025-12-31)',
      required: false,
    }),
  },
  
  async run(context) {
    const { section_id, name, notes, assigned_to_id, due } = context.propsValue;
    
    return await meisterTaskCommon.makeRequest(
      HttpMethod.POST,
      `/sections/${section_id}/tasks`,
      context.auth.access_token,
      { name, notes, assigned_to_id, due }
    );
  },
});