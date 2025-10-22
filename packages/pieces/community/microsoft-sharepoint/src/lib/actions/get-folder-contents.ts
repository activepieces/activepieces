import { microsoftSharePointAuth } from '../../';
import {
  createAction,
  Property,
  DropdownOption,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';

export const getFolderContentsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_folder_contents',
  displayName: 'Get Folder Contents',
  description: 'List all files and subfolders in a specified folder, optionally with detailed metadata.',
  props: {
    siteId: microsoftSharePointCommon.siteId,
    driveId: microsoftSharePointCommon.driveId,
    folderId: Property.Dropdown({
      displayName: 'Folder',
      description: 'The folder whose contents you want to list. Select "Root Folder" for the top-level folder.',
      required: true,
      refreshers: ['siteId', 'driveId'],
      options: async ({ auth, siteId, driveId }) => {
        if (!auth || !siteId || !driveId) {
          return {
            disabled: true,
            placeholder: 'Select a site and drive first.',
            options: [],
          };
        }
        const authValue = auth as PiecePropValueSchema<
          typeof microsoftSharePointAuth
        >;
        const client = Client.initWithMiddleware({
          authProvider: {
            getAccessToken: () => Promise.resolve(authValue.access_token),
          },
        });
        const options: DropdownOption<string>[] = [
          { label: 'Root Folder', value: 'root' },
        ];
        let response: PageCollection = await client
          .api(
            `/sites/${siteId}/drives/${driveId}/root/children?$filter=folder ne null&$select=id,name`
          )
          .get();
        while (response.value.length > 0) {
          for (const item of response.value as DriveItem[]) {
            options.push({ label: item.name!, value: item.id! });
          }
          if (response['@odata.nextLink']) {
            response = await client.api(response['@odata.nextLink']).get();
          } else {
            break;
          }
        }
        return { disabled: false, options };
      },
    }),
    includeCustomFields: Property.Checkbox({
        displayName: 'Include Custom Metadata',
        description: 'Check this to include SharePoint-specific metadata (custom columns). This may slow down the request.',
        required: false,
        defaultValue: false,
    }),
    top: Property.Number({
        displayName: 'Page Size',
        description: 'The maximum number of items to return. The API default is 200. If more items exist, the output will contain a field `@odata.nextLink` that you can use in a custom API call to get the next page.',
        required: false,
    }),
    select: Property.ShortText({
        displayName: 'Select Fields (Optional)',
        description: 'A comma-separated list of properties to return. Example: `id,name,size,webUrl`',
        required: false,
    }),
    orderby: Property.ShortText({
        displayName: 'Order By (Optional)',
        description: 'Specifies how to sort the returned items. Example: `name asc` or `lastModifiedDateTime desc`',
        required: false,
    }),
  },
  async run(context) {
    const { siteId, driveId, folderId, includeCustomFields, top, select, orderby } = context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    const baseUrl = folderId === 'root'
        ? `/sites/${siteId}/drive/root/children`
        : `/sites/${siteId}/drive/items/${folderId}/children`;


    const queryParams: {[key: string]: string | number} = {};
    if(includeCustomFields) {
        queryParams['$expand'] = 'listItem(expand=fields)';
    }
    if(top) {
        queryParams['$top'] = top;
    }
    if(select) {
        queryParams['$select'] = select;
    }
    if(orderby) {
        queryParams['$orderby'] = orderby;
    }

    const result = await client.api(baseUrl).query(queryParams).get();
    

    return result.value || [];
  },
});