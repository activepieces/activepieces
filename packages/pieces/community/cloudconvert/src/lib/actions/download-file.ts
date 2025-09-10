import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../common/auth';
import { cloudConvertApiService } from '../common/api';

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

    const fileData = await cloudConvertApiService.download(
      context.auth,
      task_id as string
    );

    return await context.files.write({
      fileName: fileData.filename,
      data: fileData.data,
    });
  },
});
