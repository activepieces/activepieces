import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetFileOutputSchema } from '../../../output-schemas';

export const getFileAction = createAction({
  auth: podioAuth,
  name: 'podio_get_file',
  outputSchema: podioGetFileOutputSchema,
  displayName: 'Get File',
  description: 'Gets one file with its name, size, type and download link.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio file: its name, description, mimetype, size, download link and the file it replaces. The file id comes from Upload File, Get Files, Get Files On App or Get Files On Space.',
    idempotent: true,
  },
  props: {
    fileId: podioAiProps.id({ required: true, displayName: 'File ID', description: 'The id of the file, from Upload File, Get Files, Get Files On App or Get Files On Space.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/file/${propsValue.fileId}` });
  },
});
