import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
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
      let folders: { id: string; label: string }[] = [];

      try {
        folders = await getFoldersRecursively(authProp, 'root', '');
      } catch (e) {
        throw new Error(`Failed to get folders\nError:${e}`);
      }

      return {
        disabled: false,
        options: folders.map((folder: { id: string; label: string }) => {
          return {
            label: folder.label,
            value: folder.id,
          };
        }),
      };
    },
  }),
   parentFolderInfo : Property.MarkDown({
    value: 
      `**Note**: If you can't find the folder in the dropdown list (which fetches up to 1000 folders), please click on the **(F)** and type the folder ID directly.\n

      you can find the folder ID in the OneDrive URL after **?id=**, e.g., "onedrive.live.com/?id=**folder-id**&cid=some-other-id"

    `,
    variant:MarkdownVariant.INFO
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

async function getFoldersRecursively(
  auth: OAuth2PropertyValue,
  folderId: string,
  parentPath = '',
  result: { label: string; id: string }[] = []
) {
  // Stop recursion if limit is reached
  if (result.length >= 1000) {
    return result;
  }

  const url = `${oneDriveCommon.baseUrl}/items/${folderId}/children?$select=id,name,folder`;

  try {
    const response = await httpClient.sendRequest<getFoldersResponse>({
      method: HttpMethod.GET,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });


    const items = response.body.value;

    const folders = items.filter((item) => item.folder);

    for (const folder of folders) {
      const path = parentPath ? `${parentPath}/${folder.name}` : folder.name;
      result.push({ label: path, id: folder.id });

      if (folder.folder?.childCount && folder.folder.childCount > 0) {
        await getFoldersRecursively(auth, folder.id, path, result);
      }
    }
  } catch (e) {
    throw new Error(`Failed to get folders\nError: ${e}`);
  }

  return result;
}

interface getFoldersResponse {
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
  value: { id: string; name: string; folder?: { childCount: number } }[];
}
