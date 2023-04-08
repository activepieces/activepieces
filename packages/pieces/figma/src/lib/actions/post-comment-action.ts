import { createAction, Property } from "@activepieces/pieces-framework";
import { assertNotNullOrUndefined } from "@activepieces/pieces-common";
import { figmaAuth } from '../common/props';
import { figmaCommon } from "../common";
import { figmaPostRequestWithMessage } from '../common/utils';

export const postCommentAction = createAction({
  name: 'post_comment',
  displayName: 'Post File Comment',
  description: 'Post file comment',
  sampleData: {
    success: true,
  },
  props: {
    authentication: figmaAuth,
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
    const token = context.propsValue.authentication?.access_token;
    const { file_key, message } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(file_key, 'file_key');
    assertNotNullOrUndefined(message, 'comment');
    
    const url = `${figmaCommon.baseUrl}/${figmaCommon.comments}`.replace(':file_key', file_key);

    return figmaPostRequestWithMessage({ token, url, message });
  },
});