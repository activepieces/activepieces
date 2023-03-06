import { createAction, Property, assertNotNullOrUndefined } from "@activepieces/framework";
import { figmaAuth } from '../common/props';
import { figmaCommon } from "../common";
import { figmaGetRequest } from '../common/utils';

export const getFileAction = createAction({
  name: 'get_file',
  displayName: 'Get file',
  description: 'Get file',
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
  },
  async run(context) {
    const token = context.propsValue.authentication?.access_token;
    const fileKey = context.propsValue.file_key;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(fileKey, 'file_key');
    
    const url = `${figmaCommon.baseUrl}/${figmaCommon.files}`.replace(':file_key', fileKey);

    return figmaGetRequest({ token, url });
  },
});
