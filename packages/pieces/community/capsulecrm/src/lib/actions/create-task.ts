import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CapsuleCRMAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { ownerIdDropdown, partyIdDropdown } from '../common/dropdown';

export const createTask = createAction({
  auth: CapsuleCRMAuth,
  name: 'createTask',
  displayName: 'Create Task',
  description: 'Create a new Task in Capsule CRM',
  props: {
    description: Property.ShortText({
      displayName: 'Task Description',
      required: true,
    }),
    partyId: partyIdDropdown,
    dueOn: Property.DateTime({
      displayName: 'Due Date',
      description: 'Pick a due date (Capsule requires YYYY-MM-DD format)',
      required: false,
    }),

    dueTime: Property.ShortText({
      displayName: 'Due Time',
      description: 'Format: HH:mm (24h)',
      required: false,
    }),

    ownerId: ownerIdDropdown,
  },
  async run({ auth, propsValue }) {
    const body: any = {
      task: {
        description: propsValue.description,
        party: { id: propsValue.partyId },
        dueOn: propsValue.dueOn,
        ...(propsValue.dueTime && { dueTime: propsValue.dueTime }),
         ...(propsValue.ownerId && { owner: { id: propsValue.ownerId } }),

      },
    };

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/tasks',
      body
    );

    return response;
  },
});
