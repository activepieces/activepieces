import { createAction, Property, assertNotNullOrUndefined } from "@activepieces/framework";
import { figmaAuth } from '../common/props';
import { figmaCommon } from "../common";
import { figmaGetRequest } from '../common/utils';

export const getCommentsAction = createAction({
  name: 'get_comments',
  displayName: 'Get File Comments',
  description: 'Get file comments',
  sampleData: {
    "success": true,
    "response_body": {
      "comments": [
        {
          "id": "123456789",
          "uuid": null,
          "file_key": "abc123DEF456ghi789JKLm",
          "parent_id": "",
          "user": {
            "handle": "User Name",
            "img_url": "https://s3-alpha.figma.com/profile/profile-id",
            "id": "123456789123"
          },
          "created_at": "2023-02-13T00:00:00.000Z",
          "resolved_at": null,
          "message": "New comment",
          "reactions": [],
          "client_meta": {
            "x": 0,
            "y": 0
          },
          "order_id": "1"
        }
      ]
    }
  },
  props: {
    authentication: figmaAuth,
    file_key: Property.ShortText({
      displayName: 'File Key',
      description: 'The Figma file key (copy from Figma file URL)',
      required: true,
    }),
  },
  async run(context) {
    const token = context.propsValue.authentication?.access_token;
    const fileKey = context.propsValue.file_key;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(fileKey, 'file_key');
    
    const url = `${figmaCommon.baseUrl}/${figmaCommon.comments}`.replace(':file_key', fileKey);

    return figmaGetRequest({ token, url });
  },
});