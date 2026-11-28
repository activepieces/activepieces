import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxGetTrashedFileOutputSchema } from '../../../output-schemas';

export const getTrashedFileAction = createAction({
  auth: boxAuth,
  name: 'box_get_trashed_file',
  outputSchema: boxGetTrashedFileOutputSchema,
  displayName: 'Get Trashed File',
  description: 'Gets the details of a Box file in the trash.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a file that is in the trash, with when it was trashed and its original parent; fails with 404 if the file is not in the trash (use Get File for active files). Get the ID from List Trashed Items.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true, description: 'ID of the trashed file. Get it from List Trashed Items.' }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/trash`,
      query: { fields: propsValue.fields },
    });
  },
});
