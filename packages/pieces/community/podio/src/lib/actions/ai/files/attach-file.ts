import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const attachFileAction = createAction({
  auth: podioAuth,
  name: 'podio_attach_file',
  displayName: 'Attach File',
  description: 'Attaches an uploaded file to an item, task, status, comment or space.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Attaches an already uploaded Podio file to an item, task, status, comment or space. Upload the file first with Upload File (or Copy File to reuse one that is attached elsewhere); the file id comes from Upload File, Get Files, Get Files On App or Get Files On Space. Each call adds another attachment.',
    idempotent: false,
  },
  props: {
    fileId: podioAiProps.id({ required: true, displayName: 'File ID', description: 'The id of the file to attach, from Upload File, Get Files, Get Files On App or Get Files On Space.' }),
    refType: podioAiProps.choice({ required: true, displayName: 'Attach To Type', description: 'The type of object to attach the file to.', values: ['item', 'task', 'status', 'comment', 'space'] }),
    refId: podioAiProps.id({ required: true, displayName: 'Attach To ID', description: 'The id of the item, task, status, comment or space to attach the file to.' }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/file/${propsValue.fileId}/attach`,
      query: podioUtils.query({ values: { silent: podioUtils.toBool({ value: propsValue.silent }) } }),
      body: { ref_type: propsValue.refType, ref_id: Number(propsValue.refId) },
    });
  },
});
