import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCopyFileOutputSchema } from '../../../output-schemas';

export const copyFileAction = createAction({
  auth: podioAuth,
  name: 'podio_copy_file',
  outputSchema: podioCopyFileOutputSchema,
  displayName: 'Copy File',
  description: 'Copies a file so it can be attached to another object.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Copies a Podio file and returns the new file id, ready to attach to another object with Attach File; the original stays where it is. The file id comes from Upload File, Get Files, Get Files On App or Get Files On Space. Each call creates another copy.',
    idempotent: false,
  },
  props: {
    fileId: podioAiProps.id({ required: true, displayName: 'File ID', description: 'The id of the file to copy, from Upload File, Get Files, Get Files On App or Get Files On Space.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/file/${propsValue.fileId}/copy` });
  },
});
