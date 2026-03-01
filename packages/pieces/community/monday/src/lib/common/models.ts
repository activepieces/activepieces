import { BoardType, MondayColumnType } from './constants';

export interface MondayColumn {
  id: string;
  title: string;
  type: MondayColumnType;
  description?: string;
  settings_str: string;
}
export interface ColumnValue {
  id: string;
  value: string;
  text: string;
  type: MondayColumnType;
  [key: string]: any;
}

export type WorkspaceResponse = {
  data: { workspaces: Workspace[] };
  account_id: number;
};

export interface Workspace {
  id: string;
  name: string;
}
export interface Group {
  id: string;
  title: string;
}
export interface SubItem {
  id: string;
  board: Board;
  group: Group;
  subscribers: User[];
  name: string;
  email: string;
  created_at: string;
}
export interface Item {
  id: string;
  board: Board;
  group: Group;
  name: string;
  email: string;
  created_at: string;
  column_values: ColumnValue[];
  subitems: SubItem[];
}
export interface Board {
  id: string;
  name: string;
  groups: Group[];
  type: BoardType;
  items_page: { items: Item[] };
}

export interface Update {
  body: string;
  id: string;
  created_at: string;
  creator: {
    name: string;
    id: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export type BoardResponse = { data: { boards: Board[] }; account_id: number };

export interface WebhookInformation {
  id: string;
  board_id: string;
}
