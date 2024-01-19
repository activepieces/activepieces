import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import { figmaCommon } from '../common';
import { figmaGetRequest } from '../common/utils';
import { figmaAuth } from '../../';

export const getCommentsAction = createAction({
  auth: figmaAuth,
  name: 'get_comments',
  displayName: 'Get File Comments',
  description: 'Get file comments',
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
