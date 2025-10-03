import { microsoftSharePointAuth } from '../../';
import {
  createAction,
  Property,
  DropdownOption,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client, PageCollection, GraphError } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';

export const findFileAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_find_file',
  displayName: 'Find File',
  description: 'Look up a file by its name or path.',
  props: {
    siteId: microsoftSharePointCommon.siteId,
    driveId: microsoftSharePointCommon.driveId,
    findMethod: Property.StaticDropdown({
        displayName: 'Find Method',
        description: 'Choose how to find the file.',
        required: true,
        options: {
            options: [
                { label: 'Find by Exact Path', value: 'path' },
                { label: 'Search by Name', value: 'search' },
            ],
        },
        defaultValue: 'search',
    }),
    filePath: Property.ShortText({
        displayName: 'File Path',
        description: "The exact path to the file from the drive's root. **Required if finding by path.** Example: `Documents/Reports/Q1-Report.docx`",
        required: false,
    }),
    searchQuery: Property.ShortText({
        displayName: 'Search Query',
        description: "The file name or keyword to search for. **Required if searching by name.** Example: `Q1-Report.docx`",
        required: false,
    }),
    searchFolderId: Property.Dropdown({
      displayName: 'Folder to Search In (Optional)',
      description: 'The folder to search within. If not specified, the entire drive will be searched. **Only applies when searching by name.**',
      required: false,
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
        const options: DropdownOption<string>[] = [];
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
  },
  async run(context) {
    const { driveId, findMethod, filePath, searchQuery, searchFolderId } = context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    if (findMethod === 'path') {
        if (!filePath) throw new Error("File Path is required when finding by path.");

        const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        try {
            const result = await client.api(`/drives/${driveId}/root:/${encodeURI(cleanPath)}`).get();
            return {
                success: true,
                files: [result]
            };
        } catch(e) {
            const error = e as GraphError;
            if (error.statusCode === 404) {
                return {
                    success: true,
                    files: []
                };
            }
            throw new Error(`Failed to find file by path: ${error.message || 'Unknown error'}`);
        }
    } else { 
        if (!searchQuery) throw new Error("Search Query is required when searching by name.");
        
        let searchUrl = `/drives/${driveId}/`;
        if (searchFolderId) {
            searchUrl += `items/${searchFolderId}/`;
        } else {
            searchUrl += 'root/';
        }
        searchUrl += `search(q='${encodeURIComponent(searchQuery)}')`;

        try {
            const response = await client.api(searchUrl).get();
            return {
                success: true,
                files: response.value || []
            };
        } catch (error: any) {
            throw new Error(`Failed to search for file: ${error.message || 'Unknown error'}`);
        }
    }
  },
});