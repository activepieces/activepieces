import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const createProject = createAction({
  auth: meistertaskAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Creates a new project in MeisterTask',
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Notes / Description',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 1 },
          { label: 'Archived', value: 2 },
        ],
      },
    }),
  },
  async run(context) {
    const token = getAccessToken(context.auth);
    const { name, notes, status } = context.propsValue;

    const body: { name: string; notes?: string; status?: number } = {
      name,
    };

    if (notes) body.notes = notes;
    if (status !== undefined && status !== null) body.status = status;

    const response = await makeRequest(
      HttpMethod.POST,
      '/projects',
      token,
      body
    );

    return response.body;
  },
});
