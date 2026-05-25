import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { parallelAuth } from '../auth';
import { parallelClient } from '../common/client';

export const getTaskRunResultAction = createAction({
  auth: parallelAuth,
  name: 'get_task_run_result',
  displayName: 'Get Task Run Result',
  description:
    'Retrieve a task run result by run ID. Blocks until the run completes (or until the timeout is reached).',
  props: {
    run_id: Property.ShortText({
      displayName: 'Run ID',
      description: 'The task run ID returned from Create Task Run.',
      required: true,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (seconds)',
      description: 'How long to wait for the run to complete. Defaults to 600 seconds.',
      required: false,
      defaultValue: 600,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};
    if (
      context.propsValue.timeout !== undefined &&
      context.propsValue.timeout !== null
    ) {
      queryParams['timeout'] = String(context.propsValue.timeout);
    }
    return await parallelClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v1/tasks/runs/${encodeURIComponent(context.propsValue.run_id)}/result`,
      queryParams,
    });
  },
});
