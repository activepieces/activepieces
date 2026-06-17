import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import { figmaCommon } from '../common';
import { figmaGetRequest } from '../common/utils';
import { figmaAuth } from '../auth';

export const getFileAction = createAction({
  auth: figmaAuth,
  name: 'get_file',
  displayName: 'Get File',
  description: 'Get file',
  audience: 'both',
  aiMetadata: { description: 'Fetch the full document tree and metadata of a Figma design file by its file key (the alphanumeric segment in a Figma file URL). Use to read a file\'s structure, pages, layers, and properties. Read-only and idempotent.', idempotent: true },
  props: {
    file_key: Property.ShortText({
      displayName: 'File Key',
      description: 'The Figma file key (copy from Figma file URL)',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const fileKey = context.propsValue.file_key;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(fileKey, 'file_key');

    const url = `${figmaCommon.baseUrl}/${figmaCommon.files}`.replace(
      ':file_key',
      fileKey
    );

    return figmaGetRequest({ token, url });
  },
});
