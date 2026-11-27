import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxGetFileOutputSchema } from '../../../output-schemas';

export const getFileAction = createAction({
  auth: boxAuth,
  name: 'box_get_file',
  outputSchema: boxGetFileOutputSchema,
  displayName: 'Get File',
  description: 'Gets the details of a Box file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Box file by ID: name, size, parent folder, owner, version, timestamps and permissions. Ask for "shared_link" in Fields to get its shared link. Get the ID from List Folder Items, Search or Upload File.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/files/${encodeURIComponent(propsValue.fileId)}`,
      query: { fields: propsValue.fields },
    });
  },
});
