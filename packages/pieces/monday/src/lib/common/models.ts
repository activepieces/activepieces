export type MondayColumType =
  | 'auto_number'
  | 'board_relation'
  | 'button'
  | 'checkbox'
  | 'color_picker'
  | 'country'
  | 'creation_log'
  | 'date'
  | 'dependency'
  | 'doc'
  | 'dropdown'
  | 'email'
  | 'file'
  | 'formula'
  | 'hour'
  | 'item_assignees'
  | 'item_id'
  | 'last_updated'
  | 'link'
  | 'location'
  | 'long_text'
  | 'mirror'
  | 'name'
  | 'numbers'
  | 'people'
  | 'progress'
  | 'rating'
  | 'status'
  | 'subtasks'
  | 'tags'
  | 'team'
  | 'text'
  | 'timeline'
  | 'time_tracking'
  | 'vote'
  | 'week'
  | 'world_clock'
  | 'unsupported';

export const enum MondayWebhookEventType {
  CHANGE_COLUMN_VALUE = 'change_column_value',
  CHANGE_STATUS_COLUMN_VALUE = 'change_status_column_value',
  CHANGE_SUBITEM_COLUMN_VALUE = 'change_subitem_column_value',
  CHANGE_SPECIFIC_COLUMN_VALUE = 'change_specific_column_value',
  CHANGE_NAME = 'change_name',
  CREATE_ITEM = 'create_item',
  ITEM_ARCHIVED = 'item_archived',
  ITEM_DELETED = 'item_deleted',
  ITEM_MOVED_TO_ANY_GROUP = 'item_moved_to_any_group',
  ITEM_MOVED_TO_SPECIFIC_GROUP = 'item_moved_to_specific_group',
  ITEM_RESTORED = 'item_restored',
  CREATE_SUBITEM = 'create_subitem',
  CHANGE_SUBITEM_NAME = 'change_subitem_name',
  MOVE_SUBITEM = 'move_subitem',
  SUBITEM_ARCHIVED = 'subitem_archived',
  SUBITEM_DELETED = 'subitem_deleted',
  CREATE_COLUMN = 'create_column',
  CREATE_UPDATE = 'create_update',
  EDIT_UPDATE = 'edit_update',
  DELETE_UPDATE = 'delete_update',
  CREATE_SUBITEM_UPDATE = 'create_subitem_update',
}
export interface MondayColumn {
  id: string;
  title: string;
  type: MondayColumType;
  description?: string;
  settings_str: string;
}
export type BoardResponse = { data: { boards: Board[] }; account_id: number };
export type WorkspaceResponse = {
  data: { workspaces: Workspace[] };
  account_id: number;
};

export interface Workspace {
  id: string;
  name: string;
}
export interface Board {
  id: string;
  name: string;
  groups: Group[];
  type: BoardType;
  items_page: { items: Item[] };
}
export interface Group {
  id: string;
  title: string;
}

export interface Item {
  id: string;
  board: Board;
  group: Group;
  name: string;
  email: string;
  created_at: string;
  subitems: SubItem[];
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
export interface SubItem {
  id: string;
  board: Board;
  group: Group;
  subscribers: User[];
  name: string;
  email: string;
  created_at: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export enum BoardType {
  BOARD = 'board',
  SUB_ITEMS_BOARD = 'sub_items_board',
}

// Update/Write opertions are not supported for these fields.
export const MondayNotSupportedFields = [
  'unsupported',
  'auto_number',
  'name',
  'person',
  'color_picker',
  'button',
  'mirror',
  'subtasks',
  'item_id',
  'creation_log',
  'file',
  'formula',
  'doc',
  'last_updated',
  'progress',
  'tags',
  'time_tracking',
  'vote',
  'people',
];
