import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth } from '../common/auth'; 
import { CloudConvertJob, CloudConvertTask } from '../common/types';

export const optimizeFile = createAction({
  auth: cloudconvertAuth,
  name: 'optimize_file',
  displayName: 'Optimize a File',
  description:
    'Creates a task to optimize and compress a file (PDF, PNG, or JPG).',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to be optimized (e.g., PDF, PNG, JPG).',
      required: true,
    }),
    profile: Property.StaticDropdown({
      displayName: 'Optimization Profile',
      description:
        'Optional: Choose an optimization profile for specific needs. Defaults to "web".',
      required: false,
      options: {
        options: [
          { label: 'Web (Default)', value: 'web' },
          { label: 'Print', value: 'print' },
          { label: 'Archive', value: 'archive' },
          { label: 'Scanned Images (MRC)', value: 'mrc' },
          { label: 'Maximum Compression', value: 'max' },
        ],
      },
    }),
    engine: Property.ShortText({
      displayName: 'Engine',
      description:
        'Optional: The optimization engine to use (e.g., "jpegoptim", "optipng").',
      required: false,
    }),
  },

  async run(context) {
    const { file, engine, profile } = context.propsValue;

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
          'optimize-task': {
            operation: 'optimize',
            input: 'import-file',
            engine: engine || undefined,
            profile: profile || undefined,
          },
          'export-file': {
            operation: 'export/url',
            input: 'optimize-task',
          },
        },
      },
    });
    const job = createJobResponse.body.data;
    const uploadTask = job.tasks.find(
      (task) => task.operation === 'import/upload'
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
        `File optimization failed: ${failedTask?.message || 'Unknown error'}`
      );
    }

    const exportTask = updatedJob.tasks.find(
      (task: CloudConvertTask) => task.operation === 'export/url'
    );
    return exportTask?.result?.files?.[0];
  },
});
