import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth } from '../common/auth';
import { CloudConvertTask } from '../common/types';

export const downloadFile = createAction({
  auth: cloudconvertAuth,
  name: 'download_file',
  displayName: 'Download a File',
  description:
    'Downloads the output file from a completed CloudConvert export task.',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description:
        'The ID of the completed "export/url" task that produced the file.',
      required: true,
    }),
  },

  async run(context) {
    const { task_id } = context.propsValue;

    const getTaskResponse = await httpClient.sendRequest<{
      data: CloudConvertTask;
    }>({
      method: HttpMethod.GET,
      url: `https://api.cloudconvert.com/v2/tasks/${task_id}`,
      headers: { Authorization: `Bearer ${context.auth}` },
    });
    const task = getTaskResponse.body.data;

    if (task.status !== 'finished') {
      throw new Error(
        `Task with ID ${task_id} is not finished. Current status: ${task.status}`
      );
    }
    const outputFile = task.result?.files?.[0];
    if (!outputFile?.url || !outputFile?.filename) {
      throw new Error(
        `Task with ID ${task_id} did not produce an output file or the URL is missing.`
      );
    }

    const fileBufferResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: outputFile.url,
      responseType: 'arraybuffer',
    });
    const fileBuffer = Buffer.from(fileBufferResponse.body as ArrayBuffer);

    return await context.files.write({
      fileName: outputFile.filename,
      data: fileBuffer,
    });
  },
});
