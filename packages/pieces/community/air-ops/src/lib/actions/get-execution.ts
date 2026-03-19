import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { airOpsAuth } from '../..';
import { makeRequest } from '../common';

export const getExecution = createAction({
  auth: airOpsAuth,
  name: 'get_execution',
  displayName: 'Get Execution',
  description: 'Get an execution by UUID.',
  props: {
    app: Property.Dropdown({
      displayName: 'Workflow',
      description: 'Select the workflow.',
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
              value: app.id,
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
    execution_uuid: Property.ShortText({
      displayName: 'Execution UUID',
      description: 'The UUID of the execution to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const { app, execution_uuid } = context.propsValue;

    const response = (await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      `/public_api/airops_apps/${app}/executions`
    )) as ExecutionsResponse;

    const execution = response.data.find((e) => e.uuid === execution_uuid);

    if (!execution) {
      throw new Error(`Execution with UUID "${execution_uuid}" not found.`);
    }

    return execution;
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

interface Execution {
  id: string;
  status: string;
  airops_apps_version_id: number;
  conversation_id: string | null;
  credits_used: number;
  error_code: string | null;
  error_message: unknown;
  feedback: string | null;
  inputs: Record<string, unknown>;
  output: Record<string, unknown> | null;
  runtime: number | null;
  source: string | null;
  uuid: string;
  workspace_id: number;
  createdAt: string;
  updatedAt: string;
}

interface ExecutionsResponse {
  data: Execution[];
  meta: {
    count: number;
    has_more: boolean;
    cursor: string;
  };
}
