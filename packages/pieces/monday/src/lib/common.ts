import { httpClient, HttpMessageBody, HttpMethod, HttpResponse, OAuth2PropertyValue, Property } from "@activepieces/framework";

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

      const response: HttpResponse<BoardResponse> = await getBoard(
        (authentication as OAuth2PropertyValue).access_token,
        workspace_id as string
      )

      return {
        disabled: false,
        options: response.body.data.boards
          .filter((value) => value.type === BoardType.BOARD)
          .map((board) => ({ label: board['name'] as string, value: board['id'] as string }))
      }
    }
  }),
  group_id: (required = false) => Property.Dropdown({
    description: 'Monday group to create item in',
    displayName: 'Group',
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
      };
    }
  }),
}

type BoardResponse = { data: { boards: Board[] }, account_id: number }
type WorkspaceResponse = { data: { workspaces: Workspace[] }, account_id: number }

interface Board {
  id: string
  name: string
  groups: Group[],
  type: BoardType
}
enum BoardType {
  BOARD = 'board',
  SUB_ITEMS_BOARD = 'sub_items_board',
  DOCUMENT = 'document',
  CUSTOM_OBJECT = 'custom_object',
}

interface Workspace {
  id: string
  name: string
}
interface Group {
  id: string
  title: string
}

export async function mondayMakeRequest<T extends HttpMessageBody>(access_token: string, query: string, method: HttpMethod): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    url: "https://api.monday.com/v2",
    method,
    headers: {
      'Authorization': access_token
    },
    body: {
      query
    }
  })
}

export async function getBoard(access_token: string, workspace_id?: string) {
  const query =
    `query {
    boards(
      ${workspace_id === 'main' ? `` : `workspace_ids: ${workspace_id},`}
      limit:10
    ) { id name type } 
  }`

  return await mondayMakeRequest<BoardResponse>(
    access_token,
    query,
    HttpMethod.GET
  )
}