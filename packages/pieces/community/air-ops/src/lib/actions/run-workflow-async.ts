import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { airOpsAuth } from '../..';
import { makeRequest } from '../common';

export const runWorkflowAsync = createAction({
  auth: airOpsAuth,
  name: 'run_workflow_async',
  displayName: 'Run Workflow (Async)',
  description: 'Queue an AirOps workflow for asynchronous execution.',
  props: {
    app: Property.Dropdown({
      displayName: 'Workflow',
      description: 'Select the workflow to execute.',
      required: true,
      refreshers: [],
      auth: airOpsAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your AirOps account first',
            options: [],
          };
        }

        try {
          const apps = await makeRequest(
            auth.secret_text,
            HttpMethod.GET,
            '/public_api/airops_apps'
          );

          return {
            disabled: false,
            options: (apps as AirOpsApp[]).map((app) => ({
              label: app.name,
              value: app.uuid,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load workflows',
            options: [],
          };
        }
      },
    }),
    inputs: Property.Json({
      displayName: 'Inputs',
      description: 'Input values for the workflow.',
      required: false,
      defaultValue: {},
    }),
    inputs_schema: Property.Json({
      displayName: 'Inputs Schema',
      description: 'Schema defining the workflow inputs (advanced).',
      required: false,
    }),
    definition: Property.Json({
      displayName: 'Definition',
      description: 'Custom workflow definition steps (advanced).',
      required: false,
    }),
  },
  async run(context) {
    const { app, inputs, inputs_schema, definition } = context.propsValue;

    const body: Record<string, unknown> = {};

    if (inputs) {
      body['inputs'] = inputs;
    }
    if (inputs_schema) {
      body['inputs_schema'] = inputs_schema;
    }
    if (definition) {
      body['definition'] = definition;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/public_api/airops_apps/${app}/async_execute_definition`,
      body
    );

    return response;
  },
});

interface AirOpsApp {
  id: number;
  name: string;
  description: string;
  background_color: string;
  created_at: string;
  updated_at: string;
  active_version_id: number;
  emoji: string;
  public: boolean;
  uuid: string;
  readme: string;
}
