import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const updateProject = createAction({
  auth: copperAuth,
  name: 'copper_update_project',
  displayName: 'Update Project',
  description: 'Updates an existing project in Copper.',
  props: {
    project_id: Property.Number({ displayName: 'Project ID', required: true }),
    name: Property.ShortText({ displayName: 'Project Name', required: false }),
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
    const body: Record<string, unknown> = {};
    
    if (ctx.propsValue.name) body.name = ctx.propsValue.name;
    if (ctx.propsValue.details) body.details = ctx.propsValue.details;
    if (ctx.propsValue.status) body.status = ctx.propsValue.status;

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.PUT,
      url: `/projects/${ctx.propsValue.project_id}`,
      body,
    });
  },
});
