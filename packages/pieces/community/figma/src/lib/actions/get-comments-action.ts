import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import { figmaCommon } from '../common';
import { figmaGetRequest } from '../common/utils';
import { figmaAuth } from '../auth';

export const getCommentsAction = createAction({
  auth: figmaAuth,
  name: 'get_comments',
  displayName: 'Get File Comments',
  description: 'Get file comments',
  audience: 'both',
  aiMetadata: { description: 'List all comments on a Figma file, identified by its file key (the alphanumeric segment in a Figma file URL). Use to review feedback or discussion threads on a design. Read-only and idempotent.', idempotent: true },
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

    const url = `${figmaCommon.baseUrl}/${figmaCommon.comments}`.replace(
      ':file_key',
      fileKey
    );

    return figmaGetRequest({ token, url });
  },
});
