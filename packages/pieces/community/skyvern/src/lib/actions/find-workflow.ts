import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { skyvernAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const findWorkflow = createAction({
  auth: skyvernAuth,
  name: 'findWorkflow',
  displayName: 'Find Workflow',
  description: 'Get all workflows with the latest version for the organization',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (>= 1)',
      required: false,
      defaultValue: 1,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of items per page (>= 1)',
      required: false,
      defaultValue: 10,
    }),
    only_saved_tasks: Property.Checkbox({
      displayName: 'Only Saved Tasks',
      description: 'Filter to show only saved tasks',
      required: false,
      defaultValue: false,
    }),
    only_workflows: Property.Checkbox({
      displayName: 'Only Workflows',
      description: 'Filter to show only workflows',
      required: false,
      defaultValue: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Filter workflows by title',
      required: false,
    }),
    template: Property.Checkbox({
      displayName: 'Template',
      description: 'Filter to show only templates',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      page,
      page_size,
      only_saved_tasks,
      only_workflows,
      title,
      template,
    } = context.propsValue;

    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (page_size) queryParams.append('page_size', page_size.toString());
    if (only_saved_tasks) queryParams.append('only_saved_tasks', only_saved_tasks.toString());
    if (only_workflows) queryParams.append('only_workflows', only_workflows.toString());
    if (title) queryParams.append('title', title);
    if (template) queryParams.append('template', template.toString());

    const response = await makeRequest(
      { apiKey: context.auth.apiKey },
      HttpMethod.GET,
      `/workflows${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {}
    );

    return response;
  },
});
