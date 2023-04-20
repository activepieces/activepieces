import { HttpMethod, HttpResponse } from "@activepieces/pieces-common";
import { OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";
import { getBoards, getItems, mondayMakeRequest } from "./data";
import { Board, BoardResponse, BoardType, Item, WorkspaceResponse } from "./types";

export const mondayProps = {
  authentication: Property.OAuth2({
    displayName: "Authentication",
    description: "OAuth2.0 Authentication",
    authUrl: "https://auth.monday.com/oauth2/authorize",
    tokenUrl: "https://auth.monday.com/oauth2/token",
    required: true,
    scope: [
      'workspaces:read',
      'webhooks:read',
      'webhooks:write',
      'boards:read',
      'boards:write'
    ]
  }),
  workspace_id: (required = false) => Property.Dropdown({
    displayName: "Workspace ID",
    description: "The workspace's unique identifier.",
    required: required,
    defaultValue: 'main',
    refreshers: ['authentication'],
    options: async ({ authentication }) => {
      if (!authentication) return { disabled: true, placeholder: 'connect your account first', options: [] }

      const response: HttpResponse<WorkspaceResponse> =
        await mondayMakeRequest<WorkspaceResponse>(
          (authentication as OAuth2PropertyValue).access_token,
          `query { workspaces(limit:10) { id name } }`,
          HttpMethod.GET
        )

      const options = response.body.data.workspaces
        .map((workspace) => ({ label: workspace.name, value: workspace.id }))

      return {
        disabled: false,
        options: [{ label: 'Main Workspace', value: 'main' }].concat(options)
      }
    }
  }),
  board_id: (required = false, refreshers = ['authentication', 'workspace_id']) => Property.Dropdown({
    displayName: "Board ID",
    description: "The board's unique identifier.",
    required: required,
    refreshers: refreshers,
    options: async ({ authentication, workspace_id }) => {
      if (!authentication) return { disabled: true, placeholder: 'connect your account first', options: [] }

      const boards: Board[] = await getBoards(
        (authentication as OAuth2PropertyValue).access_token,
        workspace_id as string
      )

      return {
        disabled: false,
        options: boards
          .filter((value) => value.type === BoardType.BOARD)
          .map((board) => ({ label: board['name'] as string, value: board['id'] as string }))
      }
    }
  }),
  group_id: (required = false) => Property.Dropdown({
    description: 'Group',
    displayName: 'Board Group',
    required: required,
    refreshers: ['authentication', 'board_id'],
    options: async ({ authentication, board_id }) => {
      if (!authentication)
        return { disabled: true, placeholder: 'connect your account first', options: [] }
      if (!board_id)
        return { disabled: true, placeholder: 'Select a board first', options: [] }

      const response: HttpResponse<BoardResponse> = await mondayMakeRequest<BoardResponse>(
        (authentication as OAuth2PropertyValue).access_token,
        `query { 
          boards(
            ids: ${board_id}, 
            limit:10
          ) 
          { groups { id title } } }
        `,
        HttpMethod.GET
      )

      const boards = response.body?.data.boards
      if (!boards)
        return { disabled: true, placeholder: 'Error fetching your boards', options: [] }

      return {
        disabled: false,
        options: (
          boards.length > 0
            ? boards[0].groups.map((group) => ({ label: group.title, value: group.id }))
            : []
        )
      }
    }
  }),
  item_id: (required = false) => Property.Dropdown({
    description: 'Item',
    displayName: 'Board Item',
    required: required,
    refreshers: ['authentication', 'board_id'],
    options: async ({ authentication, board_id }) => {
      if (!authentication)
        return { disabled: true, placeholder: 'connect your account first', options: [] }
      if (!board_id)
        return { disabled: true, placeholder: 'Select a board first', options: [] }

      const items: Item[] = await getItems({
        access_token: (authentication as OAuth2PropertyValue).access_token,
        board_id: board_id as string
      })

      return {
        disabled: false,
        options: (
          items.map((item) => ({ label: item.name, value: item.id }))
        )
      }
    }
  })
}