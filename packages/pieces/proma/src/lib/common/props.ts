import { Property } from '@activepieces/pieces-framework';
import {Table, Workspace } from './types';
import {
  getTables,
  getWorkSpaces,
} from './data';

export const promaProps = {
  // authentication: Property.OAuth2({
  //   displayName: 'Authentication',
  //   description: 'OAuth2.0 Authentication',
  //   authUrl: 'https://accounts.zoho.com/oauth/v2/auth',
  //   tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
  //   required: true,
  //   scope: [
  //     'AaaServer.profile.READ',
  //     // "ZohoCatalyst.projects.READ","ZohoCatalyst.projects.users.READ","ZohoCatalyst.tables.READ", "ZohoCatalyst.tables.rows.READ", "ZohoCatalyst.tables.rows.CREATE", "ZohoCatalyst.tables.rows.UPDATE", "ZohoCatalyst.tables.rows.DELETE", "ZohoCatalyst.tables.columns.READ",
  //     'ZohoCatalyst.functions.EXECUTE',
  //   ],
  // }),
  api_key: Property.SecretText({
    displayName: 'API Key',
    description: 'Enter API Key from Proma App',
    required: true,
  }),
  table_name: (required = false) =>
    Property.ShortText({ displayName: 'Master Sheet Name', required }),
  column_name: (required = false) =>
    Property.ShortText({ displayName: 'Column Name', required }),
  column_data_type: (required = false) =>
    Property.StaticDropdown({
      displayName: 'Column Data Type',
      required,
      options: {
        disabled: false,
        placeholder: 'Select data type',
        options: [
          { label: 'text', value: 'text' },
          { label: 'number', value: 'number' },
          { label: 'email', value: 'email' },
          { label: 'url', value: 'url' },
          { label: 'time', value: 'time' },
          { label: 'date', value: 'date' },
          { label: 'image', value: 'image' },
          { label: 'file', value: 'file' },
          { label: 'tel', value: 'tel' },
        ],
      },
    }),
  // organization_id: (required = false) =>
  //   Property.Dropdown({
  //     displayName: 'Organization',
  //     description: "The organization's unique identifier.",
  //     required: required,
  //     defaultValue: 'private',
  //     refreshers: ['api_key'],
  //     options: async ({ api_key }) => {
  //       if (!api_key)
  //         return {
  //           disabled: true,
  //           placeholder: 'enter your api key',
  //           options: [],
  //         };

  //       const response: Organization[] | null = await getOrganizations(
  //         api_key as string
  //       ).catch(() => null);

  //       if (!response)
  //         return {
  //           disabled: true,
  //           placeholder: 'api key is invalid.',
  //           options: [],
  //         };

  //       const options = (response || []).map((el) => ({
  //         label: el.name,
  //         value: el.ROWID,
  //       }));

  //       return {
  //         disabled: false,
  //         options: [{ label: 'Private', value: 'private' }].concat(options),
  //       };
  //     },
  //   }),
  workspace_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Workspace',
      description: "The workspace's unique identifier.",
      required: required,
      refreshers: ['api_key', ],
      options: async ({ api_key }) => {
        if (!api_key)
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };
       
        const response: Workspace[] | null = await getWorkSpaces(
          api_key as string,
        );

        if (!response)
          return {
            disabled: true,
            placeholder: 'Invalid API key',
            options: [],
          };

        const options = (response || []).map((el) => ({
          label: el.name,
          value: el.ROWID,
        }));

        return {
          disabled: false,
          options: options,
        };
      },
    }),
  table_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Master Sheet',
      description: '',
      required: required,
      refreshers: ['api_key', 'workspace_id'],
      options: async ({ api_key, workspace_id }) => {
        if (!api_key)
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };
        if (!workspace_id)
          return {
            disabled: true,
            placeholder: 'select a workspace first',
            options: [],
          };

        const response: Table[] | null = await getTables(
          api_key as string,
          workspace_id as string
        );

        if (!response)
          return {
            disabled: true,
            placeholder: 'Invalid API key',
            options: [],
          };

        const options = (response || []).map((el) => ({
          label: el.name,
          value: el.ROWID,
        }));

        return {
          disabled: false,
          options: options,
        };
      },
    }),
  data_row: (required = false) =>
    Property.Object({
      displayName: 'Enter data',
      required,
      defaultValue: {},
      description: 'Enter Data for Rows as Column Name:Value',
    }),
  // item_id: (required = false) => Property.Dropdown({
  //   description: 'Board Item',
  //   displayName: 'Item',
  //   required: required,
  //   refreshers: ['api_key', 'board_id'],
  //   options: async ({ api_key, board_id }) => {
  //     if (!api_key)
  //       return { disabled: true, placeholder: 'connect your account first', options: [] }
  //     if (!board_id)
  //       return { disabled: true, placeholder: 'Select a board first', options: [] }

  //     const items: Item[] = await getItems({
  //       access_token: (api_key as OAuth2PropertyValue).access_token,
  //       board_id: board_id as string
  //     })

  //     return {
  //       disabled: false,
  //       options: (
  //         items.map((item) => ({ label: item.name, value: item.id }))
  //       )
  //     }
  //   }
  // })
};
