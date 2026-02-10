import { AppConnectionValueForAuthProperty, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { mondayClient } from './client';
import { MondayColumnType, MondayNotWritableColumnType } from './constants';
import { convertMondayColumnToActivepiecesProp } from './helper';
import { mondayAuth } from '../..';

export function makeClient(auth: AppConnectionValueForAuthProperty<typeof mondayAuth>): mondayClient {
  return new mondayClient(auth.secret_text);
}

export const mondayCommon = {
  workspace_id: (required = true) =>
    Property.Dropdown({    
auth: mondayAuth,
  
      displayName: 'Workspace ID',
      required: required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };
        }

        const client = makeClient(auth);
        const res = await client.listWorkspcaes();
        return {
          disabled: false,
          options: res.data.workspaces.map((workspace) => {
            return {
              label: workspace.name,
              value: workspace.id,
            };
          }),
        };
      },
    }),
  board_id: (required = true) =>
    Property.Dropdown({    
auth: mondayAuth,
      displayName: 'Board ID',
      required: required,
      refreshers: ['workspace_id'],
      options: async ({ auth, workspace_id }) => {
        if (!auth || !workspace_id) {
          return {
            disabled: true,
            placeholder:
              'connect your account first and select your workspace.',
            options: [],
          };
        }

        const client = makeClient(auth);
        const res = await client.listWorkspaceBoards({
          workspaceId: workspace_id as string,
        });

        return {
          disabled: false,
          options: res.data.boards
            .filter((board) => board.type === 'board')
            .map((board) => {
              return {
                label: board.name,
                value: board.id,
              };
            }),
        };
      },
    }),
  group_id: (required = false) =>
    Property.Dropdown({    
auth: mondayAuth,
      displayName: 'Board Group ID',
      required: required,
      refreshers: ['board_id'],
      options: async ({ auth, board_id }) => {
        if (!auth || !board_id) {
          return {
            disabled: true,
            placeholder:
              'connect your account first and select workspace board.',
            options: [],
          };
        }
        const client = makeClient(auth);
        const res = await client.listBoardGroups({
          boardId: board_id as string,
        });
        return {
          disabled: false,
          options:
            res.data.boards.length > 0
              ? res.data.boards[0]?.groups.map((group) => ({
                  label: group.title,
                  value: group.id,
                }))
              : [],
        };
      },
    }),
  item_id: (required = true) =>
    Property.Dropdown({    
auth: mondayAuth,
      displayName: 'Item ID',
      required: required,
      refreshers: ['board_id'],
      options: async ({ auth, board_id }) => {
        if (!auth || !board_id) {
          return {
            disabled: true,
            placeholder:
              'connect your account first and select workspace board.',
            options: [],
          };
        }
        const client = makeClient(auth);
        const res = await client.listBoardItems({
          boardId: board_id as string,
        });

        const items = res.data.boards[0]?.items_page.items;
        return {
          disabled: false,
          options: items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
  columnIds: (required = true) =>
    Property.MultiSelectDropdown({
      auth: mondayAuth,
      displayName: 'Column IDs',
      description:
        'Limit data output by specifying column IDs; leave empty to display all columns.',
      required,
      refreshers: ['board_id'],
      options: async ({ auth, board_id }) => {
        if (!auth || !board_id) {
          return {
            disabled: true,
            placeholder:
              'connect your account first and select workspace board.',
            options: [],
          };
        }
        const client = makeClient(auth);
        const res = await client.listBoardColumns({
          boardId: board_id as string,
        });
        return {
          disabled: false,
          options: res.data.boards[0].columns.map((column) => {
            return {
              label: column.title,
              value: column.id,
            };
          }),
        };
      },
    }),
  columnValues: Property.DynamicProperties({
    auth: mondayAuth,
    displayName: 'Columns',
    required: true,
    refreshers: ['board_id'],
    props: async ({ auth, board_id }) => {
      if (!auth || !board_id) {
        return {
          disabled: true,
          placeholder: 'connect your account first and select workspace board.',
          options: [],
        };
      }
      const fields: DynamicPropsValue = {};
      try {
        const client = makeClient(auth);
        const res = await client.listBoardColumns({
          boardId: board_id as unknown as string,
        });
        const columns = res.data.boards[0]?.columns;
        for (const column of columns) {
          if (!MondayNotWritableColumnType.includes(column.type)) {
            if (column.type === MondayColumnType.PEOPLE) {
              const userData = await client.listUsers();
              fields[column.id] = Property.StaticMultiSelectDropdown({
                displayName: column.title,
                required: false,
                options: {
                  disabled: false,
                  options: userData.data.users.map((user) => {
                    return {
                      label: `${user.name} (${user.email})`,
                      value: user.id,
                    };
                  }),
                },
              });
            } else {
              const prop = convertMondayColumnToActivepiecesProp(column);
              if (prop != null) fields[column.id] = prop;
            }
          }
        }
      } catch (e) {
        console.debug(e);
      }
      return fields;
    },
  }),
};
