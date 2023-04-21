import { HttpMessageBody, HttpMethod, HttpResponse, httpClient } from "@activepieces/pieces-common"
import { Board, BoardResponse, Item, SubItem, Update } from "./types"

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

export async function getBoards(access_token: string, workspace_id?: string, limit = 10): Promise<Board[]> {
  const query = `
    query {
      boards(
        ${workspace_id === 'main' ? '' : `workspace_ids: ${workspace_id},`}
        limit: ${limit}
      ) { id name type }
    }
  `

  const response = await mondayMakeRequest<BoardResponse>(
    access_token,
    query,
    HttpMethod.GET
  )

  return response.body.data.boards
}

export async function getItems({
  access_token,
  board_id,
  limit = 10,
  newest_first = true
}: {
  access_token: string,
  board_id?: string,
  limit?: number,
  since?: number,
  newest_first?: boolean
}): Promise<Item[]> {
  if (!board_id) return []

  const query = `
    query {
      boards(ids: [${board_id}]) {
        id
        name
        items (limit: ${limit}, newest_first: ${newest_first}) {
          id
          name
        }
      }
    }
  `
  const response = await mondayMakeRequest<BoardResponse>(
    access_token,
    query,
    HttpMethod.GET
  )
  const board = response.body.data.boards?.[0]

  if (board)
    return board.items

  return []
}

export async function getUpdates({
  access_token,
  limit = 10
}: {
  access_token: string,
  limit?: number
}): Promise<Update[]> {
  const query = `
    query {
      updates (limit: ${limit}) {
        body
        id
        created_at
        creator {
          name
          id
        }
      }
    }
  `
  const response = await mondayMakeRequest<{ 
    data: { 
      updates: Update[] 
    }, 
    account_id: number 
  }>(
    access_token,
    query,
    HttpMethod.GET
  )

  if (response.status === 200) {
    return response.body.data.updates
  }

  return []
}

export async function getSubitems({
  access_token,
  board_id,
  item_id,
  newest_first = true
}: {
  access_token: string,
  board_id?: string,
  item_id?: string,
  limit?: number,
  since?: number,
  newest_first?: boolean
}): Promise<SubItem[]> {
  if (!board_id) return []

  const query = `
    query {
      boards (ids: [${board_id}]) {
        id
        name
        items (${item_id ? `ids: [${item_id}]` : ``}, newest_first: ${newest_first}) {
          id
          subitems {
            id
            name
          }
        }
      }
    }
  `
  const response = await mondayMakeRequest<BoardResponse>(
    access_token,
    query,
    HttpMethod.GET
  )
  const board = response.body.data.boards?.[0]

  if (board) {
    const subitems: SubItem[] = []
    board.items.forEach(
      item => {
        subitems.concat(item.subitems)
      }
    )
    return subitems
  }

  return []
}