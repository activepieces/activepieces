import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth } from '../common/auth';
import { CloudConvertJob, CloudConvertTask } from '../common/types';

export const captureWebsite = createAction({
  auth: cloudconvertAuth,
  name: 'capture_website',
  displayName: 'Capture a Website',
  description: 'Capture a webpage as a PDF, PNG, or JPG from a URL.',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL of the webpage to capture.',
      required: true,
    }),
    output_format: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'The desired output format for the capture.',
      required: true,
      options: {
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
        ],
      },
    }),
  },

  async run(context) {
    const { url, output_format } = context.propsValue;

    const createJobResponse = await httpClient.sendRequest<{
      data: CloudConvertJob;
    }>({
      method: HttpMethod.POST,
      url: 'https://api.cloudconvert.com/v2/jobs',
      headers: { Authorization: `Bearer ${context.auth}` },
      body: {
        tasks: {
          'capture-task': {
            operation: 'capture-website',
            url: url,
            output_format: output_format,
          },
          'export-file': {
            operation: 'export/url',
            input: 'capture-task',
          },
        },
      },
    });
    const job = createJobResponse.body.data;

    let updatedJob = job;
    while (updatedJob.status !== 'finished' && updatedJob.status !== 'error') {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const getJobResponse = await httpClient.sendRequest<{
        data: CloudConvertJob;
      }>({
        method: HttpMethod.GET,
        url: `https://api.cloudconvert.com/v2/jobs/${job.id}`,
        headers: { Authorization: `Bearer ${context.auth}` },
      });
      updatedJob = getJobResponse.body.data;
    }

    if (updatedJob.status === 'error') {
      const failedTask = updatedJob.tasks.find(
        (task: CloudConvertTask) => task.status === 'error'
      );
      throw new Error(
        `Website capture failed: ${failedTask?.message || 'Unknown error'}`
      );
    }

    const exportTask = updatedJob.tasks.find(
      (task: CloudConvertTask) => task.operation === 'export/url'
    );
    return exportTask?.result?.files?.[0];
  },
});
