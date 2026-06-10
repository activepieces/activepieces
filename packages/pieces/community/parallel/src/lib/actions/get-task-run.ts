import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { parallelAuth } from '../auth';
import { parallelClient } from '../common/client';

export const getTaskRunAction = createAction({
  auth: parallelAuth,
  name: 'get_task_run',
  displayName: 'Get Task Run Status',
  description: 'Retrieve the current status of a task run by its ID.',
  props: {
    run_id: Property.ShortText({
      displayName: 'Run ID',
      description: 'The task run ID, e.g. `trun_e0083b6aac0544eb8686e8d2a76533d2`.',
      required: true,
    }),
  },
  async run(context) {
    return await parallelClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v1/tasks/runs/${encodeURIComponent(context.propsValue.run_id)}`,
    });
  },
});
