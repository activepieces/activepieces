import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { mondayClient } from './client';
import { MondayColumnMapping } from './helper';
import { MondayNotSupportedFields } from './models';

export function makeClient(apiKey: string): mondayClient {
  return new mondayClient(apiKey);
}

export const mondayCommon = {
  workspace_id: (required = true) =>
    Property.Dropdown({
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

        const client = makeClient(auth as string);
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

        const client = makeClient(auth as string);
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
        const client = makeClient(auth as string);
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
        const client = makeClient(auth as string);
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
  columnValues: Property.DynamicProperties({
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
        const client = makeClient(auth as unknown as string);
        const res = await client.listBoardColumns({
          boardId: board_id as unknown as string,
        });
        const columns = res.data.boards[0]?.columns;
        for (const column of columns) {
          if (!MondayNotSupportedFields.includes(column.type)) {
            if (column.type === 'people') {
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
              fields[column.id] =
                MondayColumnMapping[column.type].buildActivepieceType(column);
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
