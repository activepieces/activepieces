import { createAction, Property, ApFile } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth } from '../common/auth';
import { CloudConvertJob, CloudConvertTask } from '../common/types';

type TaskDefinition = {
  operation: string;
  input?: string | string[];
  output_format?: string;
  filename?: string;
};

export const mergeFiles = createAction({
  auth: cloudconvertAuth,
  name: 'merge_files',
  displayName: 'Merge Files to PDF',
  description: 'Combine multiple documents or images into a single PDF.',
  props: {
    files: Property.Array({
      displayName: 'Files',
      description:
        'The files to merge (e.g., from a previous step). The order is preserved.',
      required: true,
    }),
    output_filename: Property.ShortText({
      displayName: 'Output Filename',
      description:
        'Optional: The desired filename for the final PDF (e.g., "merged-document.pdf").',
      required: false,
    }),
  },

  async run(context) {
    const { files, output_filename } = context.propsValue;
    const fileArray = files as ApFile[];

    if (fileArray.length < 2) {
      throw new Error(
        "The 'Merge Files' action requires at least two files to be provided."
      );
    }

    const importTasks: Record<string, { operation: string }> = {};
    const importTaskNames: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const taskName = `import-${i + 1}`;
      importTaskNames.push(taskName);
      importTasks[taskName] = {
        operation: 'import/upload',
      };
    }

    const jobDefinition: { tasks: Record<string, TaskDefinition> } = {
      tasks: {
        ...importTasks,
        'merge-task': {
          operation: 'merge',
          input: importTaskNames,
          output_format: 'pdf',
          filename: output_filename || undefined,
        },
        'export-file': {
          operation: 'export/url',
          input: 'merge-task',
        },
      },
    };

    const createJobResponse = await httpClient.sendRequest<{
      data: CloudConvertJob;
    }>({
      method: HttpMethod.POST,
      url: 'https://api.cloudconvert.com/v2/jobs',
      headers: { Authorization: `Bearer ${context.auth}` },
      body: jobDefinition,
    });
    const job = createJobResponse.body.data;

    const uploadTasks = job.tasks.filter(
      (task) => task.operation === 'import/upload'
    );

    const uploadPromises = uploadTasks.map((task, index) => {
      const uploadUrl = task.result?.form?.url;
      if (!uploadUrl) {
        throw new Error(
          `Could not get an upload URL for one of the files. Task name: ${task.name}`
        );
      }
      return httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: uploadUrl,
        body: fileArray[index].data,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    });
    await Promise.all(uploadPromises);

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
        `Merging files failed: ${failedTask?.message || 'Unknown error'}`
      );
    }

    const exportTask = updatedJob.tasks.find(
      (task: CloudConvertTask) => task.operation === 'export/url'
    );
    return exportTask?.result?.files?.[0];
  },
});
