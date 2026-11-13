import { OutputSchema } from '@activepieces/pieces-framework';

const referenceFields: OutputSchema['fields'] = [{ key: '$id', label: 'ID', format: 'number' }];

const creatorFields: OutputSchema['fields'] = [
  { key: '_id', label: 'User ID', format: 'number' },
  { key: 'name', label: 'Username' },
  { key: 'email', label: 'Email', format: 'email' },
];

const bookmarkCreatorFields: OutputSchema['fields'] = [
  ...creatorFields,
  { key: 'avatar', label: 'Avatar', format: 'image' },
];

const mediaFields: OutputSchema['fields'] = [
  { key: 'link', label: 'URL', format: 'image' },
  { key: 'type', label: 'Type' },
];

const fileFields: OutputSchema['fields'] = [
  { key: 'name', label: 'File Name' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'type', label: 'MIME Type' },
];

const highlightFields: OutputSchema['fields'] = [
  { key: '_id', label: 'Highlight ID' },
  { key: 'text', label: 'Highlighted Text' },
  { key: 'note', label: 'Note' },
  { key: 'color', label: 'Color' },
  { key: 'created', label: 'Created', format: 'datetime' },
];

const bookmarkHighlightFields: OutputSchema['fields'] = [
  ...highlightFields,
  { key: 'lastUpdate', label: 'Last Updated', format: 'datetime' },
  { key: 'creatorRef', label: 'Created By (User ID)', format: 'number' },
];

const bookmarkFields: OutputSchema['fields'] = [
  { key: '_id', label: 'Bookmark ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'link', label: 'URL', format: 'url' },
  { key: 'domain', label: 'Domain' },
  { key: 'excerpt', label: 'Excerpt' },
  { key: 'note', label: 'Note' },
  { key: 'type', label: 'Type' },
  { key: 'cover', label: 'Cover', format: 'image' },
  { key: 'tags', label: 'Tags' },
  { key: 'removed', label: 'In Trash', format: 'boolean' },
  { key: 'collectionId', label: 'Collection ID', format: 'number' },
  { key: 'collection', label: 'Collection', children: referenceFields },
  { key: 'user', label: 'Owner', children: referenceFields },
  { key: 'creatorRef', label: 'Created By', children: bookmarkCreatorFields },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'lastUpdate', label: 'Last Updated', format: 'datetime' },
];

const flatBookmarkFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Bookmark ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'excerpt', label: 'Excerpt' },
  { key: 'note', label: 'Note' },
  { key: 'link', label: 'URL', format: 'url' },
  { key: 'type', label: 'Type' },
  { key: 'tags', label: 'Tags' },
  { key: 'important', label: 'Favorite', format: 'boolean' },
  { key: 'collection_id', label: 'Collection ID', format: 'number' },
  { key: 'cover', label: 'Cover', format: 'image' },
  { key: 'created_at', label: 'Created', format: 'datetime' },
  { key: 'updated_at', label: 'Last Updated', format: 'datetime' },
];

const collectionFields: OutputSchema['fields'] = [
  { key: '_id', label: 'Collection ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'slug', label: 'Slug' },
  { key: 'color', label: 'Color' },
  { key: 'view', label: 'View' },
  { key: 'public', label: 'Public', format: 'boolean' },
  { key: 'expanded', label: 'Expanded', format: 'boolean' },
  { key: 'count', label: 'Bookmark Count', format: 'number' },
  { key: 'cover', label: 'Cover URLs' },
  { key: 'parent', label: 'Parent Collection', children: referenceFields },
  { key: 'user', label: 'Owner', children: referenceFields },
  { key: 'creatorRef', label: 'Created By', children: creatorFields },
  {
    key: 'access',
    label: 'Your Access',
    children: [
      { key: 'for', label: 'User ID', format: 'number' },
      { key: 'level', label: 'Access Level', format: 'number' },
      { key: 'root', label: 'Root Collection', format: 'boolean' },
      { key: 'draggable', label: 'Draggable', format: 'boolean' },
    ],
  },
  { key: 'author', label: 'You Are the Author', format: 'boolean' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'lastUpdate', label: 'Last Updated', format: 'datetime' },
  { key: 'lastAction', label: 'Last Activity', format: 'datetime' },
];

const iconSetFields: OutputSchema['fields'] = [
  { key: 'title', label: 'Title' },
  { key: 'icons', label: 'Icons', listItems: [{ key: 'png', label: 'PNG', format: 'image' }] },
];

const userConfigFields: OutputSchema['fields'] = [
  { key: 'raindrops_hide', label: 'Hidden Bookmark Elements' },
  { key: 'nested_view_legacy', label: 'Legacy Nested View', format: 'boolean' },
];

const userFields: OutputSchema['fields'] = [
  { key: '_id', label: 'User ID', format: 'number' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'name', label: 'Username' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'avatar', label: 'Avatar', format: 'image' },
  { key: 'emailConfirmed', label: 'Email Confirmed', format: 'boolean' },
  { key: 'pro', label: 'Pro', format: 'boolean' },
  { key: 'registered', label: 'Registered', format: 'datetime' },
  { key: 'lastAction', label: 'Last Activity', format: 'datetime' },
  { key: 'lastUpdate', label: 'Last Updated', format: 'datetime' },
];

const collaboratorFields: OutputSchema['fields'] = [
  ...userFields,
  { key: 'role', label: 'Role' },
  { key: 'level', label: 'Access Level', format: 'number' },
  { key: 'me', label: 'Is You', format: 'boolean' },
  { key: 'config', label: 'Settings', children: userConfigFields },
];

const accountFields: OutputSchema['fields'] = [
  ...userFields,
  { key: 'provider', label: 'Sign-in Provider' },
  { key: 'lastVisit', label: 'Last Visit', format: 'datetime' },
  {
    key: 'tfa',
    label: 'Two-Factor Auth',
    children: [{ key: 'enabled', label: 'Enabled', format: 'boolean' }],
  },
  {
    key: 'google',
    label: 'Google Sign-in',
    children: [{ key: 'enabled', label: 'Enabled', format: 'boolean' }],
  },
  {
    key: 'files',
    label: 'File Storage',
    children: [
      { key: 'used', label: 'Used', format: 'filesize' },
      { key: 'size', label: 'Quota', format: 'filesize' },
      { key: 'lastCheckPoint', label: 'Quota Period Start', format: 'datetime' },
    ],
  },
  {
    key: 'groups',
    label: 'Collection Groups',
    labelKey: 'title',
    listItems: [
      { key: 'title', label: 'Title' },
      { key: 'hidden', label: 'Hidden', format: 'boolean' },
      { key: 'collections', label: 'Collection IDs' },
    ],
  },
  {
    key: 'config',
    label: 'Settings',
    children: [
      ...userConfigFields,
      { key: 'default_collection_view', label: 'Default Collection View' },
      { key: 'raindrops_buttons', label: 'Bookmark Buttons' },
      { key: 'raindrops_search_by_score', label: 'Search by Relevance', format: 'boolean' },
      {
        key: 'raindrops_search_incollection',
        label: 'Search in Current Collection',
        format: 'boolean',
      },
      { key: 'raindrops_sort', label: 'Bookmark Sort Order' },
      { key: 'broken_level', label: 'Broken Link Check Level' },
      { key: 'font_size', label: 'Font Size', format: 'number' },
      { key: 'font_color', label: 'Font Color' },
      {
        key: 'add_default_collection',
        label: 'Default Collection for New Bookmarks',
        format: 'number',
      },
      { key: 'acknowledge', label: 'Acknowledged Notices' },
      { key: 'ai_suggestions', label: 'AI Suggestions', format: 'boolean' },
      { key: 'ai_assistant', label: 'AI Assistant', format: 'boolean' },
    ],
  },
];

const tagFields: OutputSchema['fields'] = [
  { key: '_id', label: 'Tag' },
  { key: 'count', label: 'Bookmark Count', format: 'number' },
];

export const raindropCreateBackupOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Queued', format: 'boolean' },
    { key: 'message', label: 'Message' },
  ],
};

export const raindropDownloadBackupOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'fileName', label: 'File Name' },
  ],
};

export const raindropListBackupsOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'items',
      label: 'Backups',
      labelKey: 'created',
      listItems: [
        { key: '_id', label: 'Backup ID' },
        { key: 'created', label: 'Created', format: 'datetime' },
      ],
    },
  ],
};

export const raindropDeleteBookmarksOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    { key: 'matched', label: 'Bookmarks Matched', format: 'number' },
    { key: 'modified', label: 'Bookmarks Changed', format: 'number' },
  ],
};

export const raindropGetBookmarkOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'item',
      label: 'Bookmark',
      children: [
        ...bookmarkFields,
        { key: 'important', label: 'Favorite', format: 'boolean' },
        { key: 'media', label: 'Media', listItems: mediaFields },
        { key: 'highlights', label: 'Highlights' },
        { key: 'file', label: 'Uploaded File', children: fileFields },
      ],
    },
    { key: 'author', label: 'You Are the Author', format: 'boolean' },
  ],
};

export const raindropListBookmarksOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'items',
      label: 'Bookmarks',
      labelKey: 'title',
      listItems: [
        ...bookmarkFields,
        { key: 'important', label: 'Favorite', format: 'boolean' },
        { key: 'media', label: 'Media' },
        { key: 'highlights', label: 'Highlights' },
        {
          key: 'highlight',
          label: 'Search Match',
          children: [
            { key: 'link', label: 'URL Match', format: 'html' },
            { key: 'title', label: 'Title Match', format: 'html' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Total Count', format: 'number' },
    { key: 'collectionId', label: 'Collection ID', format: 'number' },
  ],
};

export const raindropCreateBookmarkOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'item',
      label: 'Bookmark',
      children: [
        ...bookmarkFields,
        { key: 'important', label: 'Favorite', format: 'boolean' },
        { key: 'media', label: 'Media' },
      ],
    },
  ],
};

export const raindropCreateBookmarksOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'items',
      label: 'Bookmarks',
      labelKey: 'title',
      listItems: [
        ...bookmarkFields.filter(({ key }) => key !== 'creatorRef'),
        { key: 'creatorRef', label: 'Created By (User ID)', format: 'number' },
        { key: 'media', label: 'Media' },
        { key: 'highlights', label: 'Highlights' },
      ],
    },
  ],
};

export const raindropUploadBookmarkCoverOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'item',
      label: 'Bookmark',
      children: [
        ...bookmarkFields,
        { key: 'important', label: 'Favorite', format: 'boolean' },
        { key: 'media', label: 'Media', listItems: mediaFields },
      ],
    },
  ],
};

export const raindropDeleteBookmarkOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'item',
      label: 'Bookmark',
      children: [...bookmarkFields, { key: 'media', label: 'Media' }],
    },
  ],
};

export const deleteRaindropOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'deleted_id', label: 'Deleted Bookmark ID' },
  ],
};

export const getRaindropOutputSchema: OutputSchema = {
  fields: flatBookmarkFields,
};

export const findRaindropsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'raindrops',
      label: 'Bookmarks',
      value: '',
      listItems: flatBookmarkFields,
    },
  ],
  itemLabel: '{title}',
};

export const updateRaindropOutputSchema: OutputSchema = {
  fields: flatBookmarkFields,
};

export const raindropUpdateBookmarkOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'item',
      label: 'Bookmark',
      children: [
        ...bookmarkFields,
        { key: 'important', label: 'Favorite', format: 'boolean' },
        { key: 'media', label: 'Media', listItems: mediaFields },
        { key: 'highlights', label: 'Highlights' },
      ],
    },
  ],
};

export const raindropUploadFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'item',
      label: 'Bookmark',
      children: [
        ...bookmarkFields,
        { key: 'media', label: 'Media' },
        { key: 'file', label: 'Uploaded File', children: fileFields },
      ],
    },
  ],
};

export const raindropDeleteEmptyCollectionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    { key: 'count', label: 'Collections Removed', format: 'number' },
  ],
};

export const raindropGetCollectionCountsOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'items',
      label: 'Collection Counts',
      listItems: [
        { key: '_id', label: 'Collection ID', format: 'number' },
        { key: 'count', label: 'Bookmark Count', format: 'number' },
      ],
    },
    {
      key: 'meta',
      label: 'Account Summary',
      children: [
        { key: '_id', label: 'User ID', format: 'number' },
        { key: 'changedBookmarksDate', label: 'Bookmarks Last Changed', format: 'datetime' },
        { key: 'pro', label: 'Pro', format: 'boolean' },
      ],
    },
  ],
};

export const raindropEmptyTrashOutputSchema: OutputSchema = {
  fields: [{ key: 'result', label: 'Success', format: 'boolean' }],
};

export const raindropCreateCollectionOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    { key: 'item', label: 'Collection', children: collectionFields },
  ],
};

export const raindropUpdateCollectionOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    { key: 'item', label: 'Collection', children: collectionFields },
  ],
};

export const raindropDeleteCollectionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    { key: 'modified', label: 'Collections Changed', format: 'number' },
    { key: 'ids', label: 'Collection IDs' },
  ],
};

export const raindropListFeaturedCoversOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'items',
      label: 'Icon Sets',
      labelKey: 'title',
      listItems: [...iconSetFields, { key: 'link', label: 'Author URL', format: 'url' }],
    },
  ],
};

export const raindropGetCollectionOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    { key: 'item', label: 'Collection', children: collectionFields },
  ],
};

export const raindropListChildCollectionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Collections', labelKey: 'title', listItems: collectionFields },
    { key: 'count', label: 'Total Count', format: 'number' },
  ],
};

export const raindropListCollectionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Collections',
      labelKey: 'title',
      listItems: collectionFields.filter(({ key }) => key !== 'color'),
    },
    { key: 'count', label: 'Total Count', format: 'number' },
  ],
};

export const raindropSearchCoversOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    { key: 'items', label: 'Icon Sets', labelKey: 'title', listItems: iconSetFields },
  ],
};

export const raindropUploadCollectionCoverOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    { key: 'item', label: 'Collection', children: collectionFields },
  ],
};

export const raindropAddHighlightOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'item',
      label: 'Bookmark',
      children: [
        ...bookmarkFields,
        { key: 'media', label: 'Media' },
        {
          key: 'highlights',
          label: 'Highlights',
          labelKey: 'text',
          listItems: bookmarkHighlightFields,
        },
      ],
    },
  ],
};

export const raindropDeleteHighlightOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'item',
      label: 'Bookmark',
      children: [
        ...bookmarkFields,
        { key: 'media', label: 'Media' },
        { key: 'highlights', label: 'Highlights' },
      ],
    },
  ],
};

export const raindropListHighlightsOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'items',
      label: 'Highlights',
      labelKey: 'text',
      listItems: [
        ...highlightFields,
        { key: 'raindropRef', label: 'Bookmark ID', format: 'number' },
        { key: 'title', label: 'Bookmark Title' },
        { key: 'link', label: 'Bookmark URL', format: 'url' },
        { key: 'tags', label: 'Bookmark Tags' },
      ],
    },
    { key: 'count', label: 'Total Count', format: 'number' },
  ],
};

export const raindropUpdateHighlightOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'item',
      label: 'Bookmark',
      children: [
        ...bookmarkFields,
        { key: 'media', label: 'Media' },
        {
          key: 'highlights',
          label: 'Highlights',
          labelKey: 'text',
          listItems: bookmarkHighlightFields,
        },
      ],
    },
  ],
};

export const raindropCheckUrlsExistOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Any Exist', format: 'boolean' },
    { key: 'ids', label: 'Existing Bookmark IDs' },
    { key: 'id', label: 'First Existing Bookmark ID', format: 'number' },
    {
      key: 'duplicates',
      label: 'Duplicates',
      labelKey: 'link',
      listItems: [
        { key: '_id', label: 'Bookmark ID', format: 'number' },
        { key: 'link', label: 'URL', format: 'url' },
      ],
    },
  ],
};

export const raindropParseImportFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'items',
      label: 'Folders',
      labelKey: 'title',
      listItems: [
        { key: 'title', label: 'Title' },
        { key: 'created', label: 'Created', format: 'datetime' },
        { key: 'lastUpdate', label: 'Last Updated', format: 'datetime' },
        { key: 'folders', label: 'Subfolders' },
        {
          key: 'bookmarks',
          label: 'Bookmarks',
          labelKey: 'title',
          listItems: [
            { key: 'title', label: 'Title' },
            { key: 'link', label: 'URL', format: 'url' },
            { key: 'excerpt', label: 'Excerpt' },
            { key: 'note', label: 'Note' },
            { key: 'tags', label: 'Tags' },
            { key: 'cover', label: 'Cover', format: 'image' },
            { key: 'important', label: 'Favorite', format: 'boolean' },
            { key: 'media', label: 'Media' },
            { key: 'highlights', label: 'Highlights' },
            { key: 'created', label: 'Created', format: 'datetime' },
            { key: 'lastUpdate', label: 'Last Updated', format: 'datetime' },
          ],
        },
      ],
    },
    {
      key: 'count',
      label: 'Totals',
      children: [
        { key: 'bookmarks', label: 'Bookmarks', format: 'number' },
        { key: 'duplicates', label: 'Duplicates', format: 'number' },
        { key: 'folders', label: 'Folders', format: 'number' },
        { key: 'tags', label: 'Tags', format: 'number' },
        { key: 'highlights', label: 'Highlights', format: 'number' },
      ],
    },
  ],
};

export const raindropParseUrlOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'item',
      label: 'Page',
      children: [
        { key: 'title', label: 'Title' },
        { key: 'excerpt', label: 'Excerpt' },
        { key: 'type', label: 'Type' },
        { key: 'cover', label: 'Cover', format: 'image' },
        { key: 'media', label: 'Media' },
        { key: 'meta', label: 'Metadata', children: [{ key: 'tags', label: 'Tags' }] },
      ],
    },
  ],
};

export const raindropGetCurrentUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    { key: 'user', label: 'User', children: accountFields },
  ],
};

export const raindropListCollaboratorsOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    { key: 'items', label: 'Collaborators', labelKey: 'fullName', listItems: collaboratorFields },
  ],
};

export const raindropShareCollectionOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    { key: 'token', label: 'Invitation Token' },
    { key: 'link', label: 'Invitation Link', format: 'url' },
  ],
};

export const raindropGetFiltersOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    { key: 'collectionId', label: 'Collection ID', format: 'number' },
    {
      key: 'total',
      label: 'All Bookmarks',
      children: [{ key: 'count', label: 'Count', format: 'number' }],
    },
    {
      key: 'notag',
      label: 'Untagged',
      children: [{ key: 'count', label: 'Count', format: 'number' }],
    },
    {
      key: 'note',
      label: 'With Notes',
      children: [{ key: 'count', label: 'Count', format: 'number' }],
    },
    { key: 'tags', label: 'Tags', labelKey: '_id', listItems: tagFields },
    {
      key: 'types',
      label: 'Types',
      labelKey: '_id',
      listItems: [
        { key: '_id', label: 'Type' },
        { key: 'count', label: 'Bookmark Count', format: 'number' },
      ],
    },
    {
      key: 'domains',
      label: 'Domains',
      labelKey: '_id',
      listItems: [
        { key: '_id', label: 'Domain' },
        { key: 'count', label: 'Bookmark Count', format: 'number' },
      ],
    },
    {
      key: 'created',
      label: 'Created by Month',
      labelKey: '_id',
      listItems: [
        { key: '_id', label: 'Month' },
        { key: 'count', label: 'Bookmark Count', format: 'number' },
      ],
    },
  ],
};

export const raindropListTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    { key: 'items', label: 'Tags', labelKey: '_id', listItems: tagFields },
  ],
};

export const raindropGetUserByNameOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    {
      key: 'user',
      label: 'User',
      children: [...userFields, { key: 'config', label: 'Settings', children: userConfigFields }],
    },
  ],
};

export const raindropUpdateUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Success', format: 'boolean' },
    { key: 'user', label: 'User', children: accountFields },
    { key: 'item', label: 'Updated User', children: accountFields },
  ],
};

export const raindropAcceptInvitationOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Result', format: 'boolean' },
    { key: 'role', label: 'Role' },
  ],
};
