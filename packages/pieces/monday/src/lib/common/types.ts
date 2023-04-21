export type BoardResponse = { data: { boards: Board[] }, account_id: number }
export type WorkspaceResponse = { data: { workspaces: Workspace[] }, account_id: number }

export interface Workspace {
  id: string
  name: string
}
export interface Board {
  id: string
  name: string
  groups: Group[],
  type: BoardType,
  items: Item[]
}
export interface Group {
  id: string
  title: string
}

export interface Item {
  id: string
  board: Board
  group: Group
  name: string
  email: string
  created_at: string
  subitems: SubItem[]
}
export interface Update {
  body: string,
  id: string,
  created_at: string,
  creator: {
    name: string,
    id: string,
  }
}
export interface SubItem {
  id: string
  board: Board
  group: Group
  subscribers: User[]
  name: string
  email: string
  created_at: string
}
export interface User {
  id: string
  name: string
  email: string
  created_at: string
}

export enum BoardType {
  BOARD = 'board',
  SUB_ITEMS_BOARD = 'sub_items_board'
}