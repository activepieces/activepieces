import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function raindropId<R extends boolean>({
  required,
  displayName = 'Bookmark ID',
  description = 'Numeric bookmark ID, e.g. "123456789". Use List Bookmarks or Create Bookmark to get it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function collectionId<R extends boolean>({
  required,
  displayName = 'Collection ID',
  description = 'Numeric collection ID from List Collections or List Child Collections. System collections: 0 = all bookmarks, -1 = Unsorted, -99 = Trash.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function tags<R extends boolean>({
  required,
  displayName = 'Tags',
  description = 'Tag names, e.g. ["reading", "ai"].',
}: PropParams<R>) {
  return Property.Array({ displayName, description, required });
}

function booleanChoice<R extends boolean>({
  required,
  displayName,
  description,
}: PropParams<R> & { displayName: string }) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      disabled: false,
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  });
}

function collaboratorRole<R extends boolean>({
  required,
  displayName = 'Role',
  description = 'Access level: "member" can edit and invite others, "viewer" is read-only.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      disabled: false,
      options: [
        { label: 'Member', value: 'member' },
        { label: 'Viewer', value: 'viewer' },
      ],
    },
  });
}

function highlightColor<R extends boolean>({
  required,
  displayName = 'Color',
  description = 'Highlight color. Defaults to yellow.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      disabled: false,
      options: HIGHLIGHT_COLORS.map((color) => ({ label: color, value: color })),
    },
  });
}

function collectionView<R extends boolean>({
  required,
  displayName = 'View',
  description = 'How bookmarks in the collection are displayed.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      disabled: false,
      options: [
        { label: 'List', value: 'list' },
        { label: 'Simple', value: 'simple' },
        { label: 'Grid', value: 'grid' },
        { label: 'Masonry', value: 'masonry' },
      ],
    },
  });
}

function bookmarkSort<R extends boolean>({
  required,
  displayName = 'Sort',
  description = 'Sort order. Defaults to newest first (-created).',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      disabled: false,
      options: [
        { label: 'Newest first', value: '-created' },
        { label: 'Oldest first', value: 'created' },
        { label: 'Relevance (with Search only)', value: 'score' },
        { label: 'Manual order', value: '-sort' },
        { label: 'Title A-Z', value: 'title' },
        { label: 'Title Z-A', value: '-title' },
        { label: 'Domain A-Z', value: 'domain' },
        { label: 'Domain Z-A', value: '-domain' },
      ],
    },
  });
}

export const raindropAiProps = {
  raindropId,
  collectionId,
  tags,
  booleanChoice,
  collaboratorRole,
  highlightColor,
  collectionView,
  bookmarkSort,
};

const HIGHLIGHT_COLORS = [
  'yellow',
  'blue',
  'brown',
  'cyan',
  'gray',
  'green',
  'indigo',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
];
