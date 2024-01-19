import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import { figmaCommon } from '../common';
import { figmaPostRequestWithMessage } from '../common/utils';
import { figmaAuth } from '../../';

export const postCommentAction = createAction({
  auth: figmaAuth,
  name: 'post_comment',
  displayName: 'Post File Comment',
  description: 'Post file comment',
  props: {
    file_key: Property.ShortText({
      displayName: 'File Key',
      description: 'The Figma file key (copy from Figma file URL)',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Comment',
      description: 'Your comment',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { file_key, message } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(file_key, 'file_key');
    assertNotNullOrUndefined(message, 'comment');

    const url = `${figmaCommon.baseUrl}/${figmaCommon.comments}`.replace(
      ':file_key',
      file_key
    );

    return figmaPostRequestWithMessage({ token, url, message });
  },
});
