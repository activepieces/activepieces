import { OutputSchema } from '@activepieces/pieces-framework';

const changeMultipleColumnValuesFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Item ID', value: 'data.change_multiple_column_values.id' },
  { key: 'name', label: 'Item Name', value: 'data.change_multiple_column_values.name' },
];

export const updateItemNameActionOutputSchema: OutputSchema = {
  fields: changeMultipleColumnValuesFields,
};

export const updateColumnValuesOfItemActionOutputSchema: OutputSchema = {
  fields: changeMultipleColumnValuesFields,
};

export const createItemActionOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Item ID', value: 'data.create_item.id' }],
};

export const createColumnActionOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Column ID', value: 'data.create_column.id' }],
};

export const createGroupActionOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Group ID', value: 'data.create_group.id' }],
};

export const createUpdateActionOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Update ID', value: 'data.create_update.id' }],
};

export const uploadFileToColumnActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'File ID', value: 'data.add_file_to_column.id' },
    { key: 'url', label: 'File URL', value: 'data.add_file_to_column.url', format: 'url' },
    { key: 'name', label: 'File Name', value: 'data.add_file_to_column.name' },
    { key: 'file_size', label: 'File Size', value: 'data.add_file_to_column.file_size', format: 'filesize' },
    { key: 'file_extension', label: 'File Extension', value: 'data.add_file_to_column.file_extension' },
    { key: 'created_at', label: 'Created At', value: 'data.add_file_to_column.created_at', format: 'datetime' },
  ],
};

const specificColumnUpdatedEventFields: OutputSchema['fields'] = [
  { key: 'app', label: 'App' },
  { key: 'type', label: 'Event Type' },
  { key: 'triggerTime', label: 'Trigger Time', format: 'datetime' },
  { key: 'subscriptionId', label: 'Subscription ID' },
  { key: 'userId', label: 'User ID' },
  { key: 'boardId', label: 'Board ID' },
  { key: 'groupId', label: 'Group ID' },
  { key: 'isTopGroup', label: 'Is Top Group', format: 'boolean' },
  { key: 'pulseId', label: 'Item ID' },
  { key: 'pulseName', label: 'Item Name' },
  { key: 'columnId', label: 'Column ID' },
  { key: 'columnType', label: 'Column Type' },
  { key: 'columnTitle', label: 'Column Title' },
  { key: 'value', label: 'New Value', dynamicKey: true },
  { key: 'previousValue', label: 'Previous Value', dynamicKey: true },
  { key: 'triggerUuid', label: 'Trigger UUID' },
];

export const specificColumnUpdatedTriggerOutputSchema: OutputSchema = {
  itemLabel: '{event.pulseName}',
  fields: [
    {
      key: 'items',
      label: 'Events',
      value: '',
      listItems: [
        { key: 'event', label: 'Event', children: specificColumnUpdatedEventFields },
      ],
    },
  ],
};

const newItemInBoardEventFields: OutputSchema['fields'] = [
  { key: 'userId', label: 'User ID' },
  { key: 'boardId', label: 'Board ID' },
  { key: 'pulseId', label: 'Item ID' },
  { key: 'pulseName', label: 'Item Name' },
  { key: 'groupId', label: 'Group ID' },
  { key: 'groupName', label: 'Group Name' },
  { key: 'groupColor', label: 'Group Color' },
  { key: 'isTopGroup', label: 'Is Top Group', format: 'boolean' },
  { key: 'app', label: 'App' },
  { key: 'type', label: 'Event Type' },
  { key: 'triggerTime', label: 'Trigger Time', format: 'datetime' },
  { key: 'subscriptionId', label: 'Subscription ID' },
  { key: 'triggerUuid', label: 'Trigger UUID' },
];

export const newItemInBoardTriggerOutputSchema: OutputSchema = {
  itemLabel: '{event.pulseName}',
  fields: [
    {
      key: 'items',
      label: 'Items',
      value: '',
      listItems: [
        { key: 'event', label: 'Event', children: newItemInBoardEventFields },
        { key: 'columnValues', label: 'Column Values', dynamicKey: true },
      ],
    },
  ],
};
