import { Property } from '@activepieces/pieces-framework';

function boardId<R extends boolean = true>(required?: R) {
  return Property.ShortText({
    displayName: 'Board ID',
    description: 'The numeric board ID. Resolve it with List Boards.',
    required: required ?? true,
  });
}

function itemId<R extends boolean = true>(required?: R) {
  return Property.ShortText({
    displayName: 'Item ID',
    description: 'The numeric item ID. Resolve it with List Board Items or Search Items by Column Values.',
    required: required ?? true,
  });
}

function groupId<R extends boolean = true>(required?: R) {
  return Property.ShortText({
    displayName: 'Group ID',
    description: 'The group ID (e.g. "topics"). Resolve it with List Groups.',
    required: required ?? true,
  });
}

function columnId<R extends boolean = true>(required?: R) {
  return Property.ShortText({
    displayName: 'Column ID',
    description: 'The column ID (e.g. "status", "date4"). Resolve it with List Columns.',
    required: required ?? true,
  });
}

function workspaceId<R extends boolean = true>(required?: R) {
  return Property.ShortText({
    displayName: 'Workspace ID',
    description: 'The numeric workspace ID. Resolve it with List Workspaces.',
    required: required ?? true,
  });
}

function updateId<R extends boolean = true>(required?: R) {
  return Property.ShortText({
    displayName: 'Update ID',
    description: 'The update ID. Resolve it with List Item Updates.',
    required: required ?? true,
  });
}

function docId<R extends boolean = true>(required?: R) {
  return Property.ShortText({
    displayName: 'Doc ID',
    description: 'The doc ID (not the doc object ID). Resolve it with List Docs.',
    required: required ?? true,
  });
}

function folderId<R extends boolean = true>(required?: R) {
  return Property.ShortText({
    displayName: 'Folder ID',
    description: 'The folder ID. Resolve it with List Folders.',
    required: required ?? true,
  });
}

function userIds<R extends boolean = true>(required?: R) {
  return Property.Array({
    displayName: 'User IDs',
    description: 'Numeric user IDs. Resolve them with List Users.',
    required: required ?? true,
  });
}

function teamIds<R extends boolean = true>(required?: R) {
  return Property.Array({
    displayName: 'Team IDs',
    description: 'Numeric team IDs. Resolve them with List Teams.',
    required: required ?? true,
  });
}

export const mondayAiProps = {
  boardId,
  itemId,
  groupId,
  columnId,
  workspaceId,
  updateId,
  docId,
  folderId,
  userIds,
  teamIds,
};
