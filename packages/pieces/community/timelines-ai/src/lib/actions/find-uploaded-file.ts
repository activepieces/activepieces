import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth } from '../common/auth';
import { timelinesAiClient } from '../common/client';
import { FindFileRequest } from '../common/types';

export const findUploadedFileAction = createAction({
  auth: timelinesAiAuth,
  name: 'find_uploaded_file',
  displayName: 'Find Uploaded File',
  description: 'Finds uploaded files, optionally filtering by filename.',
  props: {
    filename: Property.ShortText({
      displayName: 'Filename (Optional)',
      description:
        "Part of a filename to search for (e.g., 'report.pdf' or '.pdf'). Leave blank to retrieve all files.",
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { filename } = propsValue;
    const params: FindFileRequest = {};
    if (filename) {
      params.filename = filename;
    }
    const response = await timelinesAiClient.findFiles(auth, params);
    return response.data;
  },
});
