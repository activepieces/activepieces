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

export const archiveFiles = createAction({
  auth: cloudconvertAuth,
  name: 'create_archive',
  displayName: 'Create an Archive',
  description: 'Creates a ZIP, RAR, 7Z, or other archive from multiple files.',
  props: {
    files: Property.Array({
      displayName: 'Files',
      description: 'The files to include in the archive.',
      required: true,
    }),
    output_format: Property.StaticDropdown({
      displayName: 'Archive Format',
      description: 'The desired format for the output archive.',
      required: true,
      options: {
        options: [
          { label: 'ZIP', value: 'zip' },
          { label: 'RAR', value: 'rar' },
          { label: '7Z', value: '7z' },
          { label: 'TAR', value: 'tar' },
          { label: 'TAR.GZ', value: 'tar.gz' },
          { label: 'TAR.BZ2', value: 'tar.bz2' },
        ],
      },
    }),
    output_filename: Property.ShortText({
      displayName: 'Output Filename',
      description:
        'Optional: The desired filename for the archive (e.g., "documents.zip").',
      required: false,
    }),
  },

  async run(context) {
    const { files, output_format, output_filename } = context.propsValue;
    const fileArray = files as ApFile[];

    if (!fileArray || fileArray.length === 0) {
      throw new Error('Please provide at least one file to archive.');
    }

    const importTasks: Record<string, { operation: string }> = {};
    const importTaskNames: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const taskName = `import-${i + 1}`;
      importTaskNames.push(taskName);
      importTasks[taskName] = { operation: 'import/upload' };
    }

    const jobDefinition: { tasks: Record<string, TaskDefinition> } = {
      tasks: {
        ...importTasks,
        'archive-task': {
          operation: 'archive',
          input: importTaskNames,
          output_format: output_format,
          filename: output_filename || undefined,
        },
        'export-file': {
          operation: 'export/url',
          input: 'archive-task',
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
        `Archiving files failed: ${failedTask?.message || 'Unknown error'}`
      );
    }

    const exportTask = updatedJob.tasks.find(
      (task: CloudConvertTask) => task.operation === 'export/url'
    );
    return exportTask?.result?.files?.[0];
  },
});
