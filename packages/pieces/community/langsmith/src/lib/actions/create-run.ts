import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { langsmithAuth } from '../../';
import { langsmithApiCall } from '../common';

export const createRunAction = createAction({
  auth: langsmithAuth,
  name: 'create_run',
  displayName: 'Create Run',
  description: 'Log a new run (trace) in LangSmith.',
  props: {
    name: Property.ShortText({
      displayName: 'Run Name',
      description: 'A descriptive name for this run (e.g. "Chat Pipeline").',
      required: true,
    }),
    run_type: Property.StaticDropdown({
      displayName: 'Run Type',
      description: 'The type of run being logged.',
      required: true,
      defaultValue: 'chain',
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
    inputs: Property.Json({
      displayName: 'Inputs',
      description: 'The input data for this run as JSON (e.g. {"question": "Hello"}).',
      required: true,
    }),
    session_name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The LangSmith project to log this run to. Leave empty to use the default project.',
      required: false,
    }),
    parent_run_id: Property.ShortText({
      displayName: 'Parent Run ID',
      description: 'If this is a child run, enter the parent run ID.',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      name: context.propsValue.name,
      run_type: context.propsValue.run_type,
      inputs: context.propsValue.inputs,
      start_time: new Date().toISOString(),
    };
    if (context.propsValue.session_name) {
      body['session_name'] = context.propsValue.session_name;
    }
    if (context.propsValue.parent_run_id) {
      body['parent_run_id'] = context.propsValue.parent_run_id;
    }
    const response = await langsmithApiCall({
      apiKey: context.auth,
      method: HttpMethod.POST,
      path: '/runs',
      body,
    });
    return response.body;
  },
});