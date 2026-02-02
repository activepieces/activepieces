import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { burstyAiAuth } from '../common/auth';

export const runWorkflow = createAction({
  auth: burstyAiAuth,
  name: 'runWorkflow',
  displayName: 'Run Workflow',
  description:
    'Run a Bursty AI workflow and optionally wait for and return the results',
  props: {
    workflow_id: Property.ShortText({
      displayName: 'Workflow ID',
      description: 'The ID of the Bursty AI workflow to run',
      required: true,
    }),
    get_result: Property.Checkbox({
      displayName: 'Wait for Result',
      description:
        'Wait for the workflow to complete and return the results (default: false)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const runResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://app.burstyai.com/burstyai/aiflows/${context.propsValue.workflow_id}/async_run`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'content-type': 'application/json',
      },
      body: {},
    });

    const jobData = runResponse.body;

    if (!context.propsValue.get_result) {
      return jobData;
    }

    const jobId = jobData.jobId || jobData.id;
    if (!jobId) {
      throw new Error('No job ID returned from workflow execution');
    }

    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const resultResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://app.burstyai.com/burstyai/aiflowjobs/${jobId}/result`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
        },
      });

      const result = resultResponse.body;

      if (
        result.status === 'END' ||
        result.status === 'ERROR' ||
        result.status === 'DONE'
      ) {
        return result;
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error('Workflow execution timed out after 10 minutes');
  },
});
