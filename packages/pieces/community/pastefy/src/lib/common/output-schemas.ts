import { OutputSchema } from '@activepieces/pieces-framework';

const userFields: Fields = [
  { key: 'id', label: 'User ID' },
  { key: 'name', label: 'Username' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'avatar', label: 'Avatar URL', format: 'url' },
];

const pasteFields: Fields = [
  { key: 'id', label: 'Paste ID' },
  { key: 'title', label: 'Title' },
  { key: 'content', label: 'Content', description: 'Paste text. Ciphertext when the paste is encrypted and was not decrypted; cut to 300 characters in lists with Shorten Content on.' },
  { key: 'encrypted', label: 'Encrypted', format: 'boolean' },
  { key: 'folder', label: 'Folder ID' },
  { key: 'user_id', label: 'Owner User ID' },
  { key: 'visibility', label: 'Visibility', description: 'PUBLIC, UNLISTED or PRIVATE.' },
  { key: 'type', label: 'Type', description: 'PASTE or MULTI_PASTE.' },
  { key: 'raw_url', label: 'Raw URL', format: 'url' },
  { key: 'forked_from', label: 'Forked From Paste ID' },
  { key: 'created_at', label: 'Created At', description: 'Server time, format YYYY-MM-DD HH:MM:SS.f.' },
  { key: 'expire_at', label: 'Expires At', description: 'Server time, format YYYY-MM-DD HH:MM:SS.f; absent when the paste never expires.' },
  { key: 'tags', label: 'Tags', description: 'List of tag strings.' },
  { key: 'starred', label: 'Starred', format: 'boolean' },
  { key: 'exists', label: 'Exists', format: 'boolean' },
  { key: 'user', label: 'Owner', children: userFields },
];

const singlePasteFields: Fields = [
  ...pasteFields,
  { key: 'decrypted', label: 'Decrypted', format: 'boolean', description: 'True when the piece decrypted content and title with the given password.' },
];

const folderFields: Fields = [
  { key: 'id', label: 'Folder ID' },
  { key: 'name', label: 'Name' },
  { key: 'user_id', label: 'Owner User ID' },
  { key: 'created', label: 'Created At' },
  { key: 'exists', label: 'Exists', format: 'boolean' },
  { key: 'children', label: 'Subfolders', description: 'Direct subfolders; with contents included each also carries its own children and pastes.', listItems: [{ key: 'id', label: 'Folder ID' }, { key: 'name', label: 'Name' }, { key: 'user_id', label: 'Owner User ID' }, { key: 'created', label: 'Created At' }], labelKey: 'name' },
  { key: 'pastes', label: 'Pastes', listItems: pasteFields, labelKey: 'title' },
];

const treeNodeFields: Fields = [
  { key: 'id', label: 'Folder ID' },
  { key: 'name', label: 'Name' },
  { key: 'children', label: 'Subfolders', description: 'Same shape, nested to any depth.', listItems: [{ key: 'id', label: 'Folder ID' }, { key: 'name', label: 'Name' }, { key: 'children', label: 'Subfolders' }], labelKey: 'name' },
];

export const pastefyOutputSchemas = {
  paste: { fields: singlePasteFields },
  folder: { fields: folderFields },
  folderTree: { fields: treeNodeFields, itemLabel: '{name}' },
  folderList: {
    fields: [
      { key: 'folders', label: 'Folders', labelKey: 'path', listItems: [
        { key: 'id', label: 'Folder ID' },
        { key: 'name', label: 'Name' },
        { key: 'path', label: 'Path', description: 'Names from the top folder down, joined with " / ".' },
        { key: 'parent_id', label: 'Parent Folder ID', description: 'Null for top-level folders.' },
      ] },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  pasteList: {
    fields: [
      { key: 'pastes', label: 'Pastes', listItems: pasteFields, labelKey: 'title' },
      { key: 'page', label: 'Page', format: 'number' },
      { key: 'page_limit', label: 'Page Size', format: 'number' },
      { key: 'count', label: 'Count On This Page', format: 'number' },
      { key: 'has_more', label: 'Has More', format: 'boolean', description: 'True when this page is full, so the next page may hold more.' },
    ],
  },
  deleted: {
    fields: [
      { key: 'deleted', label: 'Deleted', format: 'boolean', description: 'False when the item was already gone.' },
      { key: 'id', label: 'ID' },
    ],
  },
} satisfies Record<string, OutputSchema>;

type Fields = OutputSchema['fields'];
