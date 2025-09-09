import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth } from '../common/auth';

interface CloudConvertTask {
  id: string;
  name: string;
  status: string;
  operation: string;
  message?: string | null;
  result?: {
    form?: {
      url: string;
      parameters: Record<string, string>;
    };
    files?: {
      filename: string;
      url: string;
      size: number;
    }[];
  };
}

interface CloudConvertJob {
  id: string;
  status: string;
  tasks: CloudConvertTask[];
}

export const convertFile = createAction({
  auth: cloudconvertAuth,
  name: 'convert_file',
  displayName: 'Convert a File',
  description: 'Converts a file from one format to another.',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to be converted.',
      required: true,
    }),
    output_format: Property.ShortText({
      displayName: 'Output Format',
      description: 'The target format (e.g., "pdf", "png", "jpg").',
      required: true,
    }),
  },

  async run(context) {
    const { file, output_format } = context.propsValue;

    const createJobResponse = await httpClient.sendRequest<{
      data: CloudConvertJob;
    }>({
      method: HttpMethod.POST,
      url: 'https://api.cloudconvert.com/v2/jobs',
      headers: { Authorization: `Bearer ${context.auth}` },
      body: {
        tasks: {
          'import-file': {
            operation: 'import/upload',
          },
          'convert-file': {
            operation: 'convert',
            input: 'import-file',
            output_format: output_format,
          },
          'export-file': {
            operation: 'export/url',
            input: 'convert-file',
          },
        },
      },
    });

    const job = createJobResponse.body.data;

    const uploadTask = job.tasks.find(
      (task: CloudConvertTask) => task.name === 'import-file'
    );

    if (!uploadTask?.result?.form?.url) {
      throw new Error('Could not retrieve file upload URL from CloudConvert.');
    }

    await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: uploadTask.result.form.url,
      body: file.data,
      headers: { 'Content-Type': 'application/octet-stream' },
    });

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
        `File conversion failed: ${failedTask?.message || 'Unknown error'}`
      );
    }

    const exportTask = updatedJob.tasks.find(
      (task: CloudConvertTask) => task.operation === 'export/url'
    );
    return exportTask?.result?.files?.[0];
  },
});
