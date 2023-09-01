import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";
import { Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import dayjs from "dayjs";

export const common = {
    properties: {
        parentFolder: Property.Dropdown({
            displayName: "Parent Folder",
            required: false,
            refreshers: ['include_team_drives'],
            options: async ({ auth,include_team_drives }) => {
              if (!auth) {
                return {
                  disabled: true,
                  options: [],
                  placeholder: 'Please authenticate first'
                }
              }
              const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
              const folders = (await httpClient.sendRequest<{ files: { id: string, name: string }[] }>({
                method: HttpMethod.GET,
                url: `https://www.googleapis.com/drive/v3/files`,
                queryParams: {
                  q: "mimeType='application/vnd.google-apps.folder'",
                  includeItemsFromAllDrives: include_team_drives ? "true" : "false",
                  supportsAllDrives: "true"
                },
                authentication: {
                  type: AuthenticationType.BEARER_TOKEN,
                  token: authProp!['access_token'],
                }
              })).body.files;
    
              return {
                disabled: false,
                options: folders.map((folder: { id: string, name: string }) => {
                  return {
                    label: folder.name,
                    value: folder.id
                  }
                })
              };
            }
          }),
          include_team_drives: Property.Checkbox({
            displayName: 'Include Team Drives',
            description: 'Determines if folders from Team Drives should be included in the results.',
            defaultValue: false,
            required: false,
        })
    },

    async getFiles(auth: OAuth2PropertyValue, search?: {
        parent?: string,
        createdTime?: string | number | Date,
        createdTimeOp?: string
    }, order?: string) {
        const q: string[] = [];
        if (search?.parent) q.push(`'${search.parent}' in parents`);
        if (search?.createdTime) q.push(`createdTime ${search.createdTimeOp ?? '>'} '${dayjs(search.createdTime).format()}'`);

        const response = await httpClient.sendRequest<{ files: { id: string, name: string }[] }>({
            method: HttpMethod.GET,
            url: `https://www.googleapis.com/drive/v3/files`,
            queryParams: {
                q: q.join(' and '),
                orderBy: order ?? 'createdTime asc'
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token,
            }
        });

        return response.body.files;
    },

    async getFolders(auth: OAuth2PropertyValue, search?: {
        parent?: string,
        createdTime?: string | number | Date,
        createdTimeOp?: string
    }, order?: string) {
        const q: string[] = [`mimeType='application/vnd.google-apps.folder'`];
        if (search?.parent) q.push(`'${search.parent}' in parents`);
        if (search?.createdTime) q.push(`createdTime ${search.createdTimeOp ?? '>'} '${dayjs(search.createdTime).format()}'`);
        
        const response = await httpClient.sendRequest<{ files: { id: string, name: string }[] }>({
            method: HttpMethod.GET,
            url: `https://www.googleapis.com/drive/v3/files`,
            queryParams: {
                q: q.join(' and '),
                orderBy: order ?? 'createdTime asc'
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token,
            }
        });

        return response.body.files;
    },

}