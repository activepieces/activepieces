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

export interface MondayColumn {
  id: string;
  title: string;
  type: MondayColumType;
  description?: string;
  settings_str: string;
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
];
