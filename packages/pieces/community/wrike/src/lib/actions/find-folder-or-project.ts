import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { getWrikeApiUrl, wrikeAuth } from '../common/common';
import { Property, createAction } from '@activepieces/pieces-framework';

export const findFolderAction = createAction({
  auth: wrikeAuth,
  name: 'find_folder',
  displayName: 'Find Folder / Project',
  description: 'Retrieve folder or project metadata by ID or name',
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The exact folder ID to retrieve',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Search by folder title',
      required: false,
    }),
  },
  async run(context) {
    const apiUrl = await getWrikeApiUrl(context.auth);

    if (context.propsValue.folderId) {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${apiUrl}/folders/${context.propsValue.folderId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });
      return response.body.data[0];
    }

    const params: any = {};
    if (context.propsValue.title) {
      params.title = context.propsValue.title;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${apiUrl}/folders`,
      queryParams: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return response.body.data;
  },
});