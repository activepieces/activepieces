import { microsoftSharePointAuth } from '../../';
import {
  DropdownOption,
  DynamicPropsValue,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import {
  Site,
  Drive,
  List,
  ListItem,
  ColumnDefinition,
  DriveItem,
} from '@microsoft/microsoft-graph-types';


const createDriveDropdown = (params: {
  displayName: string;
  refreshers: string[];
}) =>
  Property.Dropdown({
    displayName: params.displayName,
    required: true,
    refreshers: params.refreshers,
    options: async ({ auth, ...props }) => {
      const siteId = props[params.refreshers[0]];

      if (!auth || !siteId) {
        return {
          disabled: true,
          placeholder: 'Please select a site first.',
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
        .api(`/sites/${siteId}/drives`)
        .select('id,name')
        .get();

      while (response.value.length > 0) {
        for (const drive of response.value as Drive[]) {
          options.push({ label: drive.name!, value: drive.id! });
        }
        if (response['@odata.nextLink']) {
          response = await client.api(response['@odata.nextLink']).get();
        } else {
          break;
        }
      }

      return {
        disabled: false,
        options,
      };
    },
  });

export const microsoftSharePointCommon = {
  siteId: Property.Dropdown({
    displayName: 'Site',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first.',
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
        .api('/sites?search=*&$select=displayName,id,name')
        .get();
      while (response.value.length > 0) {
        for (const site of response.value as Site[]) {
          options.push({ label: site.displayName!, value: site.id! });
        }
        if (response['@odata.nextLink']) {
          response = await client.api(response['@odata.nextLink']).get();
        } else {
          break;
        }
      }
      return {
        disabled: false,
        options,
      };
    },
  }),


  driveId: createDriveDropdown({
    displayName: 'Drive',
    refreshers: ['siteId'],
  }),

 
  createDriveDropdown,

  itemId: Property.Dropdown({
    displayName: 'Source File or Folder',
    required: true,
    refreshers: ['siteId', 'driveId'],
    options: async ({ auth, siteId, driveId }) => {
      if (!auth || !siteId || !driveId) {
        return {
          disabled: true,
          placeholder: 'Please select a site and drive first.',
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
          `/sites/${siteId}/drives/${driveId}/root/children?$select=id,name,folder,file`
        )
        .get();

      while (response.value.length > 0) {
        for (const item of response.value as DriveItem[]) {
          const prefix = item.folder ? '[Folder] ' : '[File] ';
          options.push({
            label: prefix + item.name!,
            value: item.id!,
          });
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


  destinationFolderId: Property.Dropdown({
    displayName: 'Destination Folder',
    description: 'The folder to copy the item into. Defaults to the root of the drive.',
    required: false,
    refreshers: ['destination_site_id', 'destination_drive_id'],
    options: async ({ auth, ...props }) => {
      const siteId = props['destination_site_id'];
      const driveId = props['destination_drive_id'];

      if (!auth || !siteId || !driveId) {
        return {
          disabled: true,
          placeholder: 'Select a destination site and drive first.',
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
          options.push({
            label: item.name!,
            value: item.id!,
          });
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

  listId: Property.Dropdown({
    displayName: 'List',
    required: true,
    refreshers: ['siteId'],
    options: async ({ auth, siteId }) => {
      if (!auth || !siteId) {
        return {
          disabled: true,
          placeholder: 'Please select a site first.',
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
        .api(`/sites/${siteId}/lists`)
        .select('displayName,id')
        .get();
      while (response.value.length > 0) {
        for (const list of response.value as List[]) {
          options.push({ label: list.displayName!, value: list.id! });
        }
        if (response['@odata.nextLink']) {
          response = await client.api(response['@odata.nextLink']).get();
        } else {
          break;
        }
      }
      return {
        disabled: false,
        options,
      };
    },
  }),

  listColumns: Property.DynamicProperties({
    displayName: 'List Columns',
    refreshers: ['siteId', 'listId'],
    required: true,
    props: async ({ auth, siteId, listId }) => {
      if (!auth || !siteId || !listId) return {};
      const fields: DynamicPropsValue = {};
      const authValue = auth as PiecePropValueSchema<
        typeof microsoftSharePointAuth
      >;
      const client = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: () => Promise.resolve(authValue.access_token),
        },
      });
      const columns: ColumnDefinition[] = [];
      let response: PageCollection = await client
        .api(`/sites/${siteId}/lists/${listId}/columns`)
        .get();
      while (response.value.length > 0) {
        for (const column of response.value as ColumnDefinition[]) {
          if (!column.readOnly) {
            columns.push(column);
          }
        }
        if (response['@odata.nextLink']) {
          response = await client.api(response['@odata.nextLink']).get();
        } else {
          break;
        }
      }
      for (const column of columns) {
        const params = {
          displayName: column.displayName!,
          description: column.description ?? '',
          required: false,
        };
        if (column.boolean) {
          fields[column.name!] = Property.Checkbox(params);
        } else if (column.text) {
          fields[column.name!] = Property.LongText(params);
        } else if (column.dateTime) {
          fields[column.name!] = Property.DateTime(params);
        } else if (column.choice) {
          if (column.choice.displayAs === 'checkBoxes') {
            fields[column.name!] = Property.StaticMultiSelectDropdown({
              ...params,
              options: {
                disabled: false,
                options: column.choice?.choices
                  ? column.choice.choices.map((choice: string) => ({
                      label: choice,
                      value: choice,
                    }))
                  : [],
              },
            });
          } else {
            fields[column.name!] = Property.StaticDropdown({
              ...params,
              options: {
                disabled: false,
                options: column.choice?.choices
                  ? column.choice.choices.map((choice: string) => ({
                      label: choice,
                      value: choice,
                    }))
                  : [],
              },
            });
          }
        } else if (column.number) {
          fields[column.name!] = Property.Number(params);
        } else if (column.currency) {
          fields[column.name!] = Property.Number(params);
        }
      }
      return fields;
    },
  }),

  listItemId: Property.Dropdown({
    displayName: 'List Item',
    required: true,
    refreshers: ['siteId', 'listId'],
    options: async ({ auth, siteId, listId }) => {
      if (!auth || !siteId || !listId) {
        return {
          disabled: true,
          placeholder: 'Please select a site and list first.',
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
          `/sites/${siteId}/lists/${listId}/items?$select=id&$expand=fields($select=Title)`
        )
        .get();
      while (response.value.length > 0) {
        for (const item of response.value as ListItem[]) {
          options.push({
            label: (item.fields as any).Title ?? `Item ${item.id}`,
            value: item.id!,
          });
        }
        if (response['@odata.nextLink']) {
          response = await client.api(response['@odata.nextLink']).get();
        } else {
          break;
        }
      }
      return {
        disabled: false,
        options,
      };
    },
  }),

  pageId: Property.Dropdown({
    displayName: 'Page',
    required: true,
    refreshers: ['siteId'],
    options: async ({ auth, siteId }) => {
      if (!auth || !siteId) {
        return {
          disabled: true,
          placeholder: 'Please select a site first.',
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
        .api(`/sites/${siteId}/pages?$select=id,title`)
        .get();
      while (response.value.length > 0) {
        for (const page of response.value as any[]) {
          options.push({
            label: page.title ?? `Page ${page.id}`,
            value: page.id!,
          });
        }
        if (response['@odata.nextLink']) {
          response = await client.api(response['@odata.nextLink']).get();
        } else {
          break;
        }
      }
      return {
        disabled: false,
        options,
      };
    },
  }),
};