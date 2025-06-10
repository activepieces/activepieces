import { createAction } from '@activepieces/pieces-framework';
import { skyVernAuth } from '../../index';
import { skyVernProps } from '../common/props';
import { makeClient } from '../common/client';

export const findWorkflow = createAction({
  auth: skyVernAuth,
  name: 'findWorkflow',
  displayName: 'Find Workflow',
  description: 'Finds workflow based on title.',
  props: {
    page: skyVernProps.page,
    page_size: skyVernProps.page_size,
    only_saved_tasks: skyVernProps.only_saved_tasks,
    only_workflows: skyVernProps.only_workflows,
    title: skyVernProps.title,
    template: skyVernProps.template,
  },
  async run(context) {
    const { auth, propsValue } = context;
    const client = makeClient(auth);
    const queryParams: Record<string, unknown> = {};
    if (propsValue.title !== undefined && propsValue.title !== null) {
      queryParams['title'] = propsValue.title;
    }
    if (propsValue.page !== undefined && propsValue.page !== null) {
      queryParams['page'] = propsValue.page;
    }
    if (propsValue.page_size !== undefined && propsValue.page_size !== null) {
      queryParams['page_size'] = propsValue.page_size;
    }
    if (propsValue.only_saved_tasks) { 
      queryParams['only_saved_tasks'] = propsValue.only_saved_tasks;
    }
    if (propsValue.only_workflows) { 
      queryParams['only_workflows'] = propsValue.only_workflows;
    }
    if (propsValue.template) { 
      queryParams['template'] = propsValue.template;
    }
    return await client.workflows.list(queryParams);
  },
});
