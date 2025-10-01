import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { getWrikeApiUrl, wrikeAuth } from '../common/common';
import { Property, createAction } from '@activepieces/pieces-framework';

export const createFolderAction = createAction({
  auth: wrikeAuth,
  name: 'create_folder',
  displayName: 'Create Folder',
  description: 'Create a new folder in Wrike',
  props: {
    parentFolderId: Property.ShortText({
      displayName: 'Parent Folder ID',
      description: 'The parent folder ID',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Folder title',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Folder description',
      required: false,
    }),
  },
  async run(context) {
    const apiUrl = await getWrikeApiUrl(context.auth);
    const body: any = {
      title: context.propsValue.title,
    };

    if (context.propsValue.description) {
      body.description = context.propsValue.description;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${apiUrl}/folders/${context.propsValue.parentFolderId}/folders`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return response.body.data[0];
  },
});