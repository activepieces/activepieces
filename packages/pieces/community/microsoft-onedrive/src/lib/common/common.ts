import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';

export const oneDriveCommon = {
  baseUrl: 'https://graph.microsoft.com/v1.0/me/drive',

  parentFolder: Property.Dropdown({
    displayName: 'Parent Folder',
    required: false,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }

      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
      let folders: { id: string; name: string }[] = [];

      try {
        const result = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${oneDriveCommon.baseUrl}/items/root/children?$filter=folder ne null`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authProp.access_token,
          },
        });
        folders = result.body['value'];
      } catch (e) {
        throw new Error(`Failed to get folders\nError:${e}`);
      }

      return {
        disabled: false,
        options: folders.map((folder: { id: string; name: string }) => {
          return {
            label: folder.name,
            value: folder.id,
          };
        }),
      };
    },
  }),

  async getFiles(
    auth: OAuth2PropertyValue,
    search?: {
      parentFolder?: string;
      createdTime?: string | number | Date;
      createdTimeOp?: string;
    }
  ) {
    let url = `${this.baseUrl}/items/root/children?$filter=folder eq null`;
    if (search?.parentFolder) {
      url = `${this.baseUrl}/items/${search.parentFolder}/children?$filter=folder eq null`;
    }

    const response = await httpClient.sendRequest<{
      value: { id: string; name: string; createdDateTime: string }[];
    }>({
      method: HttpMethod.GET,
      url: url,
      queryParams: {
        $select: 'id,name,createdDateTime',
        $orderby: 'createdDateTime asc',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });

    const files = response.body.value;

    if (search?.createdTime) {
      const compareDate = dayjs(search.createdTime);
      return files.filter((file) => {
        const fileDate = dayjs(file.createdDateTime);
        const comparison =
          search.createdTimeOp === '<'
            ? fileDate.isBefore(compareDate)
            : fileDate.isAfter(compareDate);
        return comparison;
      });
    }

    return files;
  },
};
