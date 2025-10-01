import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { getWrikeApiUrl, wrikeAuth } from '../common/common';
import { Property, createAction } from '@activepieces/pieces-framework';


export const addCommentAction = createAction({
  auth: wrikeAuth,
  name: 'add_comment',
  displayName: 'Add Comment',
  description: 'Add a comment or internal note to a task or folder',
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The ID of the folder',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Comment Text',
      description: 'The comment text',
      required: true,
    }),
    plainText: Property.Checkbox({
      displayName: 'Plain Text',
      description: 'Whether the comment is plain text (true) or HTML (false)',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const apiUrl = await getWrikeApiUrl(context.auth);
    const body = {
      text: context.propsValue.text,
      plainText: context.propsValue.plainText !== false,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${apiUrl}/folders/${context.propsValue.folderId}/comments`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return response.body.data[0];
  },
});
