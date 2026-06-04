import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  teamhoodApiCall,
  TeamhoodAuth,
  TeamhoodBoard,
  TeamhoodRow,
  TeamhoodStatus,
  TeamhoodUser,
  TeamhoodWorkspace,
} from './client';
import { teamhoodAuth } from './auth';

export const workspaceIdDropdown = (required: boolean) =>
  Property.Dropdown({
    auth: teamhoodAuth,
    displayName: 'Workspace',
    description: 'Select a Teamhood workspace.',
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Teamhood account first',
        };
      }
      try {
        const response = await teamhoodApiCall<{ workspaces: TeamhoodWorkspace[] }>({
          auth: auth.props as TeamhoodAuth,
          method: HttpMethod.GET,
          path: '/workspaces',
        });
        const workspaces = response.body.workspaces ?? [];
        if (workspaces.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No workspaces found in your Teamhood account.',
          };
        }
        return {
          disabled: false,
          options: workspaces.map((w) => ({
            label: w.title,
            value: w.id,
          })),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder:
            'Failed to load workspaces. Check your API URL and API key.',
        };
      }
    },
  });

export const boardIdDropdown = (required: boolean) =>
  Property.Dropdown({
    auth: teamhoodAuth,
    displayName: 'Board',
    description: 'Select a board in the chosen workspace.',
    required,
    refreshers: ['workspaceId'],
    options: async ({ auth, workspaceId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Teamhood account first',
        };
      }
      if (!workspaceId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a workspace first',
        };
      }
      try {
        const response = await teamhoodApiCall<{ boards: TeamhoodBoard[] }>({
          auth: auth.props as TeamhoodAuth,
          method: HttpMethod.GET,
          path: `/workspaces/${workspaceId}/boards`,
        });
        const boards = response.body.boards ?? [];
        return {
          disabled: false,
          options: boards.map((b) => ({ label: b.title, value: b.id })),
          placeholder:
            boards.length === 0
              ? 'No boards found in this workspace.'
              : undefined,
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load boards.',
        };
      }
    },
  });

export const rowIdDropdown = (required: boolean) =>
  Property.Dropdown({
    auth: teamhoodAuth,
    displayName: 'Row',
    description:
      'Select a swimlane row on the selected board. Rows group items horizontally on a Kanban board.',
    required,
    refreshers: ['boardId'],
    options: async ({ auth, boardId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Teamhood account first',
        };
      }
      if (!boardId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a board first',
        };
      }
      try {
        const response = await teamhoodApiCall<{ rows: TeamhoodRow[] }>({
          auth: auth.props as TeamhoodAuth,
          method: HttpMethod.GET,
          path: `/boards/${boardId}/rows`,
        });
        const rows = response.body.rows ?? [];
        return {
          disabled: false,
          options: rows.map((r) => ({ label: r.title, value: r.id })),
          placeholder:
            rows.length === 0 ? 'No rows found on this board.' : undefined,
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load rows.',
        };
      }
    },
  });

export const statusIdDropdown = (required: boolean) =>
  Property.Dropdown({
    auth: teamhoodAuth,
    displayName: 'Status',
    description: 'The status column on the board (e.g. To Do, In Progress, Done).',
    required,
    refreshers: ['boardId'],
    options: async ({ auth, boardId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Teamhood account first',
        };
      }
      if (!boardId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a board first',
        };
      }
      try {
        const response = await teamhoodApiCall<{ statuses: TeamhoodStatus[] }>({
          auth: auth.props as TeamhoodAuth,
          method: HttpMethod.GET,
          path: `/boards/${boardId}/statuses`,
        });
        const statuses = response.body.statuses ?? [];
        return {
          disabled: false,
          options: statuses.map((s) => ({
            label: `${s.title} (${s.type})`,
            value: s.id,
          })),
          placeholder:
            statuses.length === 0 ? 'No statuses on this board.' : undefined,
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load statuses.',
        };
      }
    },
  });

export const userIdDropdown = (params: {
  displayName: string;
  description: string;
  required: boolean;
}) =>
  Property.Dropdown({
    auth: teamhoodAuth,
    displayName: params.displayName,
    description: params.description,
    required: params.required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Teamhood account first',
        };
      }
      try {
        const response = await teamhoodApiCall<{ users: TeamhoodUser[] }>({
          auth: auth.props as TeamhoodAuth,
          method: HttpMethod.GET,
          path: '/users',
        });
        const users = response.body.users ?? [];
        return {
          disabled: false,
          options: users
            .filter((u) => u.status !== 'Disabled')
            .map((u) => ({
              label: `${u.firstName} ${u.lastName} (${u.email})`,
              value: u.id,
            })),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load users.',
        };
      }
    },
  });

export const itemIdDropdown = (required: boolean) =>
  Property.Dropdown({
    auth: teamhoodAuth,
    displayName: 'Item',
    description:
      'The Teamhood item (task) to operate on. Select a workspace to load items.',
    required,
    refreshers: ['workspaceId', 'boardId'],
    options: async ({ auth, workspaceId, boardId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Teamhood account first',
        };
      }
      if (!workspaceId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a workspace first',
        };
      }
      try {
        const queryParams: Record<string, string> = {
          WorkspaceId: workspaceId as string,
        };
        if (boardId) {
          queryParams['BoardId'] = boardId as string;
        }
        const response = await teamhoodApiCall<{
          items?: { id: string; displayId: string; title: string | null }[];
        }>({
          auth: auth.props as TeamhoodAuth,
          method: HttpMethod.GET,
          path: '/items',
          queryParams,
        });
        const items = response.body.items ?? [];
        return {
          disabled: false,
          options: items.map((item) => ({
            label: item.title
              ? `${item.title} (#${item.displayId})`
              : `#${item.displayId}`,
            value: item.id,
          })),
          placeholder:
            items.length === 0 ? 'No items found.' : undefined,
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load items.',
        };
      }
    },
  });
