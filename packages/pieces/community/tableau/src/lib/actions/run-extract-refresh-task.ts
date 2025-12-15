import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { tableauAuth } from '../../index';
import { getAuthToken, buildTableauUrl, getTableauHeaders, listExtractRefreshTasks } from '../common';

function ensureString(body: any): string {
  if (typeof body === 'string') return body;
  if (typeof body === 'object') return JSON.stringify(body);
  return String(body);
}

export const runExtractRefreshTask = createAction({
  name: 'run_extract_refresh_task',
  displayName: 'Run Extract Refresh Task',
  description: 'Runs the specified extract refresh task and returns job information',
  auth: tableauAuth,
  props: {
    taskId: Property.Dropdown({
 auth: tableauAuth,     displayName: 'Extract Refresh Task',
      description: 'Select the extract refresh task to run',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        try {
          const tasks = await listExtractRefreshTasks(auth as any);

          const options = tasks.map((task: any) => {
            let label = `Task ${task.id}`;
            if (task.workbookId) {
              label += ` (Workbook: ${task.workbookId})`;
            } else if (task.datasourceId) {
              label += ` (Datasource: ${task.datasourceId})`;
            }
            if (task.schedule?.frequency) {
              label += ` - ${task.schedule.frequency}`;
            }

            return {
              label,
              value: task.id,
            };
          });

          return {
            disabled: false,
            options,
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load tasks. Please check your authentication.',
          };
        }
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { taskId } = propsValue;
    const tableauAuth = auth as any;

    const { token: authToken, siteId } = await getAuthToken(tableauAuth);

    const apiVersion = tableauAuth.apiVersion || '3.26';
    const runTaskUrl = buildTableauUrl(tableauAuth.serverUrl, apiVersion, siteId, `tasks/extractRefreshes/${taskId}/runNow`);

    const requestBody = '<?xml version="1.0" encoding="UTF-8"?><tsRequest></tsRequest>';

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: runTaskUrl,
      headers: {
        ...getTableauHeaders(authToken),
        'Content-Type': 'application/xml',
      },
      body: requestBody,
    });

    if (response.status !== 200 && response.status !== 202) {
      throw new Error(`Failed to run extract refresh task: ${response.status} - ${response.body}`);
    }

    const responseBody = ensureString(response.body);

    const jobIdMatch = responseBody.match(/<job[^>]*id="([^"]+)"/);
    const jobId = jobIdMatch ? jobIdMatch[1] : null;

    const modeMatch = responseBody.match(/mode="([^"]+)"/);
    const mode = modeMatch ? modeMatch[1] : null;

    const typeMatch = responseBody.match(/type="([^"]+)"/);
    const type = typeMatch ? typeMatch[1] : null;

    return {
      success: true,
      taskId,
      job: {
        id: jobId,
        mode,
        type,
      },
      message: 'Extract refresh task has been queued successfully',
    };
  },
});
