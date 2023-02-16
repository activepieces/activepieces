import { createAction, Property, assertNotNullOrUndefined } from "@activepieces/framework";
import { figmaAuth } from '../common/props';
import { figmaCommon } from "../common";
import { figmaPostRequestWithMessage } from '../common/utils';

export const postCommentAction = createAction({
  name: 'post_comment',
  displayName: 'Post file comment',
  description: 'Post file comment',
  sampleData: {
    success: true,
  },
  props: {
    authentication: figmaAuth,
    fileKey: Property.ShortText({
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
    const { fileKey, message } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(fileKey, 'fileKey');
    assertNotNullOrUndefined(message, 'comment');
    
    const url = `${figmaCommon.baseUrl}/${figmaCommon.comments}`.replace(':file_key', fileKey);

    return figmaPostRequestWithMessage({ token, url, message });
  },
});