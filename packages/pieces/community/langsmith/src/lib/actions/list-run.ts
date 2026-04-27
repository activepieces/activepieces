import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { langsmithAuth } from '../../';
import { langsmithApiCall } from '../common';

export const listRunsAction = createAction({
  auth: langsmithAuth,
  name: 'list_runs',
  displayName: 'List Runs',
  description: 'Query and filter runs (traces) in a LangSmith project.',
  props: {
    project_name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The name of the LangSmith project to query runs from.',
      required: false,
    }),
    run_type: Property.StaticDropdown({
      displayName: 'Run Type',
      description: 'Filter by run type.',
      required: false,
      options: {
        options: [
          { label: 'Chain', value: 'chain' },
          { label: 'LLM', value: 'llm' },
          { label: 'Tool', value: 'tool' },
          { label: 'Retriever', value: 'retriever' },
          { label: 'Prompt', value: 'prompt' },
          { label: 'Parser', value: 'parser' },
          { label: 'Embedding', value: 'embedding' },
        ],
      },
    }),
    is_root: Property.Checkbox({
      displayName: 'Root Runs Only',
      description: 'Only return top-level runs (not child runs).',
      required: false,
      defaultValue: true,
    }),
    error: Property.Checkbox({
      displayName: 'Errors Only',
      description: 'Only return runs that resulted in an error.',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of runs to return (default: 10, max: 100).',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {};
    if (context.propsValue.project_name) {
      body['session_name'] = context.propsValue.project_name;
    }
    if (context.propsValue.run_type) {
      body['run_type'] = context.propsValue.run_type;
    }
    if (context.propsValue.is_root) {
      body['is_root'] = context.propsValue.is_root;
    }
    if (context.propsValue.error) {
      body['error'] = context.propsValue.error;
    }
    body['limit'] = context.propsValue.limit ?? 10;

    const response = await langsmithApiCall({
      apiKey: context.auth,
      method: HttpMethod.POST,
      path: '/runs/query',
      body,
    });
    return response.body;
  },
});