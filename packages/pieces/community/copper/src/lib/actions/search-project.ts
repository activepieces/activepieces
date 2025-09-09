import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const searchProject = createAction({
  auth: copperAuth,
  name: 'copper_search_project',
  displayName: 'Search for a Project',
  description: 'Lookup a project using search criteria.',
  props: {
    name: Property.ShortText({ displayName: 'Project Name', required: false }),
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
    page_size: Property.Number({
      displayName: 'Page Size',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(ctx) {
    const body: Record<string, unknown> = {
      page_size: ctx.propsValue.page_size || 20,
    };
    
    if (ctx.propsValue.name) body.name = ctx.propsValue.name;
    if (ctx.propsValue.status) body.status = ctx.propsValue.status;

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.POST,
      url: `/projects/search`,
      body,
    });
  },
});
