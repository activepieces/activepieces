import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const createProject = createAction({
  auth: copperAuth,
  name: 'copper_create_project',
  displayName: 'Create Project',
  description: 'Adds a new project in Copper.',
  props: {
    name: Property.ShortText({ displayName: 'Project Name', required: true }),
    details: Property.LongText({ displayName: 'Details', required: false }),
    status: Property.Dropdown({
      displayName: 'Status',
      required: false,
      options: async () => ({
        options: [
          { label: 'Open', value: 'Open' },
          { label: 'Completed', value: 'Completed' },
        ],
      }),
    }),
  },
  async run(ctx) {
    const body: Record<string, unknown> = {
      name: ctx.propsValue.name,
      details: ctx.propsValue.details,
      status: ctx.propsValue.status,
    };

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.POST,
      url: `/projects`,
      body,
    });
  },
});
