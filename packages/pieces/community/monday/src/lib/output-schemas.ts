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
  fields: [
    { key: 'event', label: 'Event', children: specificColumnUpdatedEventFields },
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
  fields: [
    { key: 'event', label: 'Event', children: newItemInBoardEventFields },
    { key: 'columnValues', label: 'Column Values', dynamicKey: true },
  ],
};

const aiItemSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Item ID' },
  { key: 'name', label: 'Item Name' },
  { key: 'state', label: 'State' },
  { key: 'url', label: 'Item URL', format: 'url' },
  { key: 'board_id', label: 'Board ID' },
  { key: 'group_id', label: 'Group ID' },
];

const aiItemColumnValueField: OutputSchema['fields'][number] = {
  key: 'column_values',
  label: 'Column Values',
  labelKey: 'column_id',
  listItems: [
    { key: 'column_id', label: 'Column ID' },
    { key: 'type', label: 'Column Type' },
    { key: 'text', label: 'Text' },
    { key: 'value', label: 'Raw Value (JSON)' },
  ],
};

const aiItemWithValuesFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Item ID' },
  { key: 'name', label: 'Item Name' },
  { key: 'state', label: 'State' },
  { key: 'url', label: 'Item URL', format: 'url' },
  { key: 'board_id', label: 'Board ID' },
  { key: 'group_id', label: 'Group ID' },
  { key: 'group_title', label: 'Group Title' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  aiItemColumnValueField,
];

const aiItemSummarySchema: OutputSchema = { fields: aiItemSummaryFields };

const aiItemPageSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: aiItemWithValuesFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'cursor', label: 'Next Page Cursor' },
  ],
};

export const getItemsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Item ID' },
        { key: 'name', label: 'Item Name' },
        { key: 'state', label: 'State' },
        { key: 'url', label: 'Item URL', format: 'url' },
        { key: 'board_id', label: 'Board ID' },
        { key: 'board_name', label: 'Board Name' },
        { key: 'group_id', label: 'Group ID' },
        { key: 'group_title', label: 'Group Title' },
        { key: 'parent_item_id', label: 'Parent Item ID' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        aiItemColumnValueField,
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listBoardItemsActionOutputSchema: OutputSchema = aiItemPageSchema;

export const searchItemsByColumnValuesActionOutputSchema: OutputSchema = aiItemPageSchema;

export const listSubitemsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'subitems',
      label: 'Subitems',
      labelKey: 'name',
      listItems: [...aiItemWithValuesFields, { key: 'parent_item_id', label: 'Parent Item ID' }],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const createBoardItemActionOutputSchema: OutputSchema = aiItemSummarySchema;

export const setItemColumnValuesActionOutputSchema: OutputSchema = aiItemSummarySchema;

export const renameItemActionOutputSchema: OutputSchema = aiItemSummarySchema;

export const changeSimpleColumnValueActionOutputSchema: OutputSchema = aiItemSummarySchema;

export const changeColumnValueActionOutputSchema: OutputSchema = aiItemSummarySchema;

export const duplicateItemActionOutputSchema: OutputSchema = aiItemSummarySchema;

export const moveItemToGroupActionOutputSchema: OutputSchema = aiItemSummarySchema;

export const moveItemToBoardActionOutputSchema: OutputSchema = aiItemSummarySchema;

export const archiveItemActionOutputSchema: OutputSchema = aiItemSummarySchema;

export const changeItemPositionActionOutputSchema: OutputSchema = aiItemSummarySchema;

export const createSubitemActionOutputSchema: OutputSchema = {
  fields: [...aiItemSummaryFields, { key: 'parent_item_id', label: 'Parent Item ID' }],
};

export const clearItemUpdatesActionOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }, ...aiItemSummaryFields],
};

export const deleteItemActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'id', label: 'Deleted Item ID' },
  ],
};

export const updateAssetsOnItemActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'item_id', label: 'Item ID' },
    {
      key: 'assets',
      label: 'Assets',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Asset ID' },
        { key: 'name', label: 'File Name' },
        { key: 'url', label: 'File URL', format: 'url' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const aiUpdateFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Update ID' },
  { key: 'item_id', label: 'Item ID' },
  { key: 'body', label: 'Body', format: 'html' },
  { key: 'text_body', label: 'Text Body' },
  { key: 'creator_id', label: 'Creator ID' },
  { key: 'creator_name', label: 'Creator Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const aiUpdateLikeFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Update ID' },
  { key: 'item_id', label: 'Item ID' },
  { key: 'liked', label: 'Liked', format: 'boolean' },
];

const aiUpdatePinFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Update ID' },
  { key: 'item_id', label: 'Item ID' },
  { key: 'pinned', label: 'Pinned', format: 'boolean' },
];

const aiColumnFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Column ID' },
  { key: 'board_id', label: 'Board ID' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
];

const aiGroupFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Group ID' },
  { key: 'board_id', label: 'Board ID' },
  { key: 'title', label: 'Title' },
  { key: 'color', label: 'Color' },
];

export const postItemUpdateActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Update ID' },
    { key: 'item_id', label: 'Item ID' },
    { key: 'parent_id', label: 'Parent Update ID' },
    { key: 'body', label: 'Body', format: 'html' },
    { key: 'text_body', label: 'Text Body' },
    { key: 'creator_id', label: 'Creator ID' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const listItemUpdatesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'updates',
      label: 'Updates',
      labelKey: 'text_body',
      listItems: [
        ...aiUpdateFields,
        { key: 'reply_count', label: 'Reply Count', format: 'number' },
        {
          key: 'replies',
          label: 'Replies',
          labelKey: 'text_body',
          listItems: [
            { key: 'id', label: 'Reply ID' },
            { key: 'body', label: 'Body', format: 'html' },
            { key: 'text_body', label: 'Text Body' },
            { key: 'creator_id', label: 'Creator ID' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listBoardUpdatesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'updates',
      label: 'Updates',
      labelKey: 'text_body',
      listItems: [{ key: 'board_id', label: 'Board ID' }, ...aiUpdateFields],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const editUpdateActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Update ID' },
    { key: 'item_id', label: 'Item ID' },
    { key: 'body', label: 'Body', format: 'html' },
    { key: 'text_body', label: 'Text Body' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};

export const deleteUpdateActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Update ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const likeUpdateActionOutputSchema: OutputSchema = {
  fields: aiUpdateLikeFields,
};

export const unlikeUpdateActionOutputSchema: OutputSchema = {
  fields: aiUpdateLikeFields,
};

export const pinUpdateActionOutputSchema: OutputSchema = {
  fields: aiUpdatePinFields,
};

export const unpinUpdateActionOutputSchema: OutputSchema = {
  fields: aiUpdatePinFields,
};

export const uploadFileActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Asset ID' },
    { key: 'name', label: 'File Name' },
    { key: 'url', label: 'File URL', format: 'url' },
    { key: 'file_extension', label: 'File Extension' },
    { key: 'file_size', label: 'File Size', format: 'filesize' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'target', label: 'Target' },
    { key: 'target_id', label: 'Target ID' },
  ],
};

export const getAssetsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'assets',
      label: 'Assets',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Asset ID' },
        { key: 'name', label: 'File Name' },
        { key: 'url', label: 'File URL', format: 'url' },
        { key: 'public_url', label: 'Public URL', format: 'url' },
        { key: 'thumbnail_url', label: 'Thumbnail URL', format: 'image' },
        { key: 'file_extension', label: 'File Extension' },
        { key: 'file_size', label: 'File Size', format: 'filesize' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'uploaded_by_id', label: 'Uploaded By ID' },
        { key: 'uploaded_by_name', label: 'Uploaded By Name' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listColumnsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'board_id', label: 'Board ID' },
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'Column ID' },
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
        { key: 'description', label: 'Description' },
        { key: 'settings', label: 'Settings (JSON)' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        { key: 'width', label: 'Width', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const addBoardColumnActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Column ID' },
    { key: 'board_id', label: 'Board ID' },
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
  ],
};

export const updateColumnActionOutputSchema: OutputSchema = {
  fields: aiColumnFields,
};

export const deleteColumnActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Column ID' },
    { key: 'board_id', label: 'Board ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const getColumnTypeSchemaActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'column_type', label: 'Column Type' },
    { key: 'schema', label: 'JSON Schema' },
  ],
};

export const listGroupsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'board_id', label: 'Board ID' },
    {
      key: 'groups',
      label: 'Groups',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'Group ID' },
        { key: 'title', label: 'Title' },
        { key: 'color', label: 'Color' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        { key: 'deleted', label: 'Deleted', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const addBoardGroupActionOutputSchema: OutputSchema = {
  fields: aiGroupFields,
};

export const updateGroupActionOutputSchema: OutputSchema = {
  fields: [...aiGroupFields, { key: 'updated_attributes', label: 'Updated Attributes' }],
};

export const deleteGroupActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Group ID' },
    { key: 'board_id', label: 'Board ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const archiveGroupActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Group ID' },
    { key: 'board_id', label: 'Board ID' },
    { key: 'title', label: 'Title' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
  ],
};

export const duplicateGroupActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'New Group ID' },
    { key: 'board_id', label: 'Board ID' },
    { key: 'source_group_id', label: 'Source Group ID' },
    { key: 'title', label: 'Title' },
    { key: 'color', label: 'Color' },
  ],
};

const aiBoardFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Board ID' },
  { key: 'name', label: 'Board Name' },
  { key: 'description', label: 'Description' },
  { key: 'state', label: 'State' },
  { key: 'board_kind', label: 'Board Kind' },
  { key: 'url', label: 'Board URL', format: 'url' },
  { key: 'workspace_id', label: 'Workspace ID' },
  { key: 'folder_id', label: 'Folder ID' },
];

const aiBoardStateFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Board ID' },
  { key: 'name', label: 'Board Name' },
  { key: 'state', label: 'State' },
];

const aiBoardTeamFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Team ID' },
  { key: 'name', label: 'Team Name' },
];

const aiBoardRemovedUserFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'name', label: 'User Name' },
];

const aiWorkspaceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Workspace ID' },
  { key: 'name', label: 'Workspace Name' },
  { key: 'kind', label: 'Kind' },
  { key: 'description', label: 'Description' },
  { key: 'state', label: 'State' },
];

const aiFolderFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Folder ID' },
  { key: 'name', label: 'Folder Name' },
  { key: 'color', label: 'Color' },
  { key: 'workspace_id', label: 'Workspace ID' },
  { key: 'parent_folder_id', label: 'Parent Folder ID' },
];

export const listBoardsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'boards',
      label: 'Boards',
      labelKey: 'name',
      listItems: [
        ...aiBoardFields,
        { key: 'items_count', label: 'Items Count', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'owner_ids', label: 'Owner IDs' },
        { key: 'owner_names', label: 'Owner Names' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const createBoardActionOutputSchema: OutputSchema = {
  fields: aiBoardFields,
};

export const updateBoardActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'board_id', label: 'Board ID' },
    { key: 'attribute', label: 'Updated Attribute' },
    { key: 'new_value', label: 'New Value' },
    { key: 'success', label: 'Success', format: 'boolean' },
  ],
};

export const duplicateBoardActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'New Board ID' },
    { key: 'name', label: 'New Board Name' },
    { key: 'url', label: 'New Board URL', format: 'url' },
    { key: 'workspace_id', label: 'Workspace ID' },
    { key: 'source_board_id', label: 'Source Board ID' },
  ],
};

export const archiveBoardActionOutputSchema: OutputSchema = {
  fields: aiBoardStateFields,
};

export const deleteBoardActionOutputSchema: OutputSchema = {
  fields: aiBoardStateFields,
};

export const updateBoardHierarchyActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    { key: 'board_id', label: 'Board ID' },
    { key: 'workspace_id', label: 'Workspace ID' },
    { key: 'folder_id', label: 'Folder ID' },
  ],
};

export const getBoardActivityLogsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'activity_logs',
      label: 'Activity Logs',
      labelKey: 'event',
      listItems: [
        { key: 'id', label: 'Log ID' },
        { key: 'event', label: 'Event' },
        { key: 'entity', label: 'Entity' },
        { key: 'user_id', label: 'User ID' },
        { key: 'account_id', label: 'Account ID' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'data', label: 'Event Data' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listBoardViewsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'views',
      label: 'Views',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'View ID' },
        { key: 'name', label: 'View Name' },
        { key: 'type', label: 'View Type' },
        { key: 'access_level', label: 'Access Level' },
        { key: 'source_view_id', label: 'Source View ID' },
        { key: 'board_id', label: 'Board ID' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const addUsersToBoardActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'board_id', label: 'Board ID' },
    { key: 'role', label: 'Role' },
    {
      key: 'users',
      label: 'Users',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'User ID' },
        { key: 'name', label: 'User Name' },
        { key: 'email', label: 'Email', format: 'email' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const removeBoardSubscribersActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'board_id', label: 'Board ID' },
    { key: 'removed_users', label: 'Removed Users', labelKey: 'name', listItems: aiBoardRemovedUserFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const addTeamsToBoardActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'board_id', label: 'Board ID' },
    { key: 'teams', label: 'Teams', labelKey: 'name', listItems: aiBoardTeamFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const removeTeamsFromBoardActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'board_id', label: 'Board ID' },
    { key: 'removed_teams', label: 'Removed Teams', labelKey: 'name', listItems: aiBoardTeamFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listWorkspacesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'workspaces',
      label: 'Workspaces',
      labelKey: 'name',
      listItems: [
        ...aiWorkspaceFields,
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'is_default_workspace', label: 'Is Default Workspace', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const createWorkspaceActionOutputSchema: OutputSchema = {
  fields: [...aiWorkspaceFields, { key: 'created_at', label: 'Created At', format: 'datetime' }],
};

export const updateWorkspaceActionOutputSchema: OutputSchema = {
  fields: aiWorkspaceFields,
};

export const deleteWorkspaceActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Workspace ID' },
    { key: 'name', label: 'Workspace Name' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const addUsersToWorkspaceActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'workspace_id', label: 'Workspace ID' },
    { key: 'role', label: 'Role' },
    { key: 'users', label: 'Users', labelKey: 'name', listItems: aiBoardRemovedUserFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const deleteUsersFromWorkspaceActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'workspace_id', label: 'Workspace ID' },
    { key: 'removed_users', label: 'Removed Users', labelKey: 'name', listItems: aiBoardRemovedUserFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const addTeamsToWorkspaceActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'workspace_id', label: 'Workspace ID' },
    { key: 'teams', label: 'Teams', labelKey: 'name', listItems: aiBoardTeamFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const deleteTeamsFromWorkspaceActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'workspace_id', label: 'Workspace ID' },
    { key: 'removed_teams', label: 'Removed Teams', labelKey: 'name', listItems: aiBoardTeamFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listFoldersActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'folders',
      label: 'Folders',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Folder ID' },
        { key: 'name', label: 'Folder Name' },
        { key: 'color', label: 'Color' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'owner_id', label: 'Owner ID' },
        { key: 'workspace_id', label: 'Workspace ID' },
        { key: 'workspace_name', label: 'Workspace Name' },
        { key: 'parent_folder_id', label: 'Parent Folder ID' },
        { key: 'parent_folder_name', label: 'Parent Folder Name' },
        { key: 'sub_folder_ids', label: 'Sub-folder IDs' },
        { key: 'board_ids', label: 'Board IDs' },
        { key: 'board_names', label: 'Board Names' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const createFolderActionOutputSchema: OutputSchema = {
  fields: [...aiFolderFields, { key: 'created_at', label: 'Created At', format: 'datetime' }],
};

export const updateFolderActionOutputSchema: OutputSchema = {
  fields: aiFolderFields,
};

export const deleteFolderActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Folder ID' },
    { key: 'name', label: 'Folder Name' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

const aiDocBaseFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Doc ID' },
  { key: 'object_id', label: 'Doc Object ID' },
  { key: 'name', label: 'Name' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'workspace_id', label: 'Workspace ID' },
];

const aiDocBlockFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Block ID' },
  { key: 'type', label: 'Type' },
  { key: 'position', label: 'Position', format: 'number' },
  { key: 'parent_block_id', label: 'Parent Block ID' },
  { key: 'content', label: 'Content (JSON)' },
];

const aiUserFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'title', label: 'Title' },
  { key: 'kind', label: 'Kind' },
  { key: 'status', label: 'Status' },
  { key: 'url', label: 'Profile URL', format: 'url' },
  { key: 'time_zone', label: 'Time Zone' },
  { key: 'country_code', label: 'Country Code' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const aiMiscTagFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Tag ID' },
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
];

const aiMiscMuteSettingFields: OutputSchema['fields'] = [
  { key: 'board_id', label: 'Board ID' },
  { key: 'mute_state', label: 'Mute State' },
];

export const listDocsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'docs',
      label: 'Docs',
      labelKey: 'name',
      listItems: [
        ...aiDocBaseFields,
        { key: 'doc_kind', label: 'Doc Kind' },
        { key: 'folder_id', label: 'Folder ID' },
        { key: 'created_by_id', label: 'Created By ID' },
        { key: 'created_by_name', label: 'Created By' },
        { key: 'created_at', label: 'Created At', format: 'date' },
        { key: 'updated_at', label: 'Updated At', format: 'date' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const createDocActionOutputSchema: OutputSchema = {
  fields: aiDocBaseFields,
};

export const getDocBlocksActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'doc_id', label: 'Doc ID' },
    {
      key: 'blocks',
      label: 'Blocks',
      labelKey: 'type',
      listItems: [
        ...aiDocBlockFields,
        { key: 'created_by_id', label: 'Created By ID' },
        { key: 'created_at', label: 'Created At', format: 'date' },
        { key: 'updated_at', label: 'Updated At', format: 'date' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const createDocBlockActionOutputSchema: OutputSchema = {
  fields: [...aiDocBlockFields, { key: 'doc_id', label: 'Doc ID' }],
};

export const updateDocBlockActionOutputSchema: OutputSchema = {
  fields: aiDocBlockFields,
};

export const deleteDocBlockActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Block ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const appendMarkdownToDocActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'doc_id', label: 'Doc ID' },
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'block_ids', label: 'New Block IDs' },
    { key: 'block_count', label: 'Block Count', format: 'number' },
  ],
};

export const importDocFromHtmlActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'doc_id', label: 'Doc ID' },
    { key: 'success', label: 'Success', format: 'boolean' },
  ],
};

export const exportDocAsMarkdownActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'doc_id', label: 'Doc ID' },
    { key: 'markdown', label: 'Markdown' },
  ],
};

export const renameDocActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'doc_id', label: 'Doc ID' },
    { key: 'name', label: 'Name' },
  ],
};

export const duplicateDocActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'source_doc_id', label: 'Source Doc ID' },
    { key: 'new_doc_id', label: 'New Doc Object ID' },
  ],
};

export const deleteDocActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'doc_id', label: 'Doc ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const getMeActionOutputSchema: OutputSchema = {
  fields: [
    ...aiUserFields,
    { key: 'photo_url', label: 'Photo', format: 'image' },
    { key: 'account_id', label: 'Account ID' },
    { key: 'account_name', label: 'Account Name' },
    { key: 'account_slug', label: 'Account Slug' },
  ],
};

export const getAccountActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Account ID' },
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'tier', label: 'Tier' },
    { key: 'country_code', label: 'Country Code' },
    { key: 'active_members_count', label: 'Active Members', format: 'number' },
    { key: 'first_day_of_the_week', label: 'First Day of the Week' },
    { key: 'is_during_trial', label: 'In Trial', format: 'boolean' },
    { key: 'is_trial_expired', label: 'Trial Expired', format: 'boolean' },
    { key: 'show_timeline_weekends', label: 'Show Timeline Weekends', format: 'boolean' },
    { key: 'plan_tier', label: 'Plan Tier' },
    { key: 'plan_period', label: 'Plan Period' },
    { key: 'plan_max_users', label: 'Plan Max Users', format: 'number' },
    { key: 'plan_version', label: 'Plan Version' },
    { key: 'products', label: 'Products' },
  ],
};

export const listUsersActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'users',
      label: 'Users',
      labelKey: 'name',
      listItems: [
        ...aiUserFields,
        { key: 'location', label: 'Location' },
        { key: 'phone', label: 'Phone' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listTeamsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'teams',
      label: 'Teams',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Team ID' },
        { key: 'name', label: 'Name' },
        { key: 'picture_url', label: 'Picture', format: 'image' },
        { key: 'member_count', label: 'Member Count', format: 'number' },
        { key: 'member_ids', label: 'Member IDs' },
        { key: 'member_names', label: 'Member Names' },
        { key: 'member_emails', label: 'Member Emails' },
        { key: 'owner_ids', label: 'Owner IDs' },
        { key: 'owner_names', label: 'Owner Names' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listTagsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'tags', label: 'Tags', labelKey: 'name', listItems: aiMiscTagFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const createOrGetTagActionOutputSchema: OutputSchema = {
  fields: aiMiscTagFields,
};

export const sendNotificationActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'sent', label: 'Sent', format: 'boolean' },
    { key: 'user_id', label: 'User ID' },
    { key: 'target_type', label: 'Target Type' },
    { key: 'target_id', label: 'Target ID' },
    { key: 'text', label: 'Text' },
  ],
};

export const listNotificationsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'notifications',
      label: 'Notifications',
      labelKey: 'text',
      listItems: [
        { key: 'id', label: 'Notification ID' },
        { key: 'title', label: 'Title' },
        { key: 'text', label: 'Text' },
        { key: 'read', label: 'Read', format: 'boolean' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'board_id', label: 'Board ID' },
        { key: 'board_name', label: 'Board Name' },
        { key: 'item_id', label: 'Item ID' },
        { key: 'item_name', label: 'Item Name' },
        { key: 'update_id', label: 'Update ID' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const searchActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Results',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'entity_type', label: 'Entity Type' },
        { key: 'name', label: 'Name' },
        { key: 'url', label: 'URL Path' },
        { key: 'board_id', label: 'Board ID' },
        { key: 'workspace_id', label: 'Workspace ID' },
        { key: 'description', label: 'Description' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const getFavoritesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'favorites',
      label: 'Favorites',
      labelKey: 'object_type',
      listItems: [
        { key: 'id', label: 'Favorite ID' },
        { key: 'object_id', label: 'Object ID' },
        { key: 'object_type', label: 'Object Type' },
        { key: 'folder_id', label: 'Folder ID' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const getFormActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Form ID' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'active', label: 'Active', format: 'boolean' },
    { key: 'is_anonymous', label: 'Anonymous', format: 'boolean' },
    { key: 'owner_id', label: 'Owner ID' },
    { key: 'question_count', label: 'Question Count', format: 'number' },
    {
      key: 'questions',
      label: 'Questions',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'Question ID' },
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
        { key: 'required', label: 'Required', format: 'boolean' },
        { key: 'visible', label: 'Visible', format: 'boolean' },
      ],
    },
  ],
};

export const aggregateBoardDataActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'board_id', label: 'Board ID' },
    { key: 'function', label: 'Function' },
    { key: 'column_id', label: 'Column ID' },
    { key: 'group_by_column_id', label: 'Group By Column ID' },
    {
      key: 'rows',
      label: 'Rows',
      labelKey: 'group_value',
      listItems: [
        { key: 'group_value', label: 'Group Value' },
        { key: 'value', label: 'Value', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const getBoardMuteSettingsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'settings', label: 'Settings', labelKey: 'board_id', listItems: aiMiscMuteSettingFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const updateBoardMuteSettingsActionOutputSchema: OutputSchema = {
  fields: [...aiMiscMuteSettingFields, { key: 'enabled', label: 'Enabled Notifications' }],
};
