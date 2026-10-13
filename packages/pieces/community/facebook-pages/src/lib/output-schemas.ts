import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

export const createPostActionOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Post ID' }],
};

export const createPhotoPostActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Photo ID' },
    { key: 'post_id', label: 'Post ID' },
  ],
};

export const createVideoPostActionOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Video ID' }],
};

const pageMetaFields: OutputSchemaField[] = [
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'next_cursor', label: 'Next Cursor', description: 'Pass as After Cursor to fetch the next page. Empty on the last page.' },
];

const postResultFields: OutputSchemaField[] = [
  { key: 'success', label: 'Success', format: 'boolean' },
  { key: 'post_id', label: 'Post ID' },
];

const postFields: OutputSchemaField[] = [
  { key: 'id', label: 'Post ID' },
  { key: 'message', label: 'Message' },
  { key: 'created_time', label: 'Created Time', format: 'datetime' },
  { key: 'updated_time', label: 'Updated Time', format: 'datetime' },
  { key: 'permalink_url', label: 'Permalink', format: 'url' },
  { key: 'status_type', label: 'Post Type' },
  { key: 'full_picture', label: 'Picture', format: 'image' },
  { key: 'is_published', label: 'Published', format: 'boolean' },
];

export const listManagedPagesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Pages',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Page ID' },
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        { key: 'username', label: 'Username' },
        { key: 'link', label: 'Link', format: 'url' },
        { key: 'tasks', label: 'Tasks' },
      ],
    },
    ...pageMetaFields,
  ],
};

export const pageDetailsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Page ID' },
    { key: 'name', label: 'Name' },
    { key: 'username', label: 'Username' },
    { key: 'category', label: 'Category' },
    { key: 'about', label: 'About' },
    { key: 'description', label: 'Description' },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'website', label: 'Website', format: 'url' },
    { key: 'phone', label: 'Phone' },
    { key: 'emails', label: 'Emails' },
    { key: 'single_line_address', label: 'Address' },
    { key: 'followers_count', label: 'Followers', format: 'number' },
    { key: 'verification_status', label: 'Verification Status' },
    { key: 'is_published', label: 'Published', format: 'boolean' },
    { key: 'picture_url', label: 'Profile Picture', value: 'picture.data.url', format: 'image' },
    { key: 'cover_url', label: 'Cover Photo', value: 'cover.source', format: 'image' },
  ],
};

export const createPagePostOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Post ID' }],
};

export const createPagePhotoPostOutputSchema: OutputSchema = {
  fields: [
    { key: 'post_id', label: 'Post ID' },
    { key: 'id', label: 'Photo ID' },
  ],
};

export const createPageVideoPostOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Video ID' }],
};

export const createMultiPhotoPostOutputSchema: OutputSchema = {
  fields: [
    { key: 'post_id', label: 'Post ID' },
    { key: 'photo_ids', label: 'Photo IDs' },
  ],
};

export const pagePostsOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Posts', labelKey: 'message', listItems: postFields }, ...pageMetaFields],
};

export const postOutputSchema: OutputSchema = {
  fields: [
    ...postFields,
    { key: 'scheduled_publish_time', label: 'Scheduled Publish Time (Unix seconds)', format: 'number' },
    {
      key: 'attachments',
      label: 'Attachments',
      value: 'attachments.data',
      labelKey: 'title',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'media_type', label: 'Media Type' },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'image', label: 'Image', value: 'media.image.src', format: 'image' },
      ],
    },
  ],
};

export const postResultOutputSchema: OutputSchema = {
  fields: postResultFields,
};

export const reschedulePostOutputSchema: OutputSchema = {
  fields: [...postResultFields, { key: 'scheduled_publish_time', label: 'Scheduled Publish Time', format: 'datetime' }],
};

export const scheduledPostsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Scheduled Posts',
      labelKey: 'message',
      listItems: [
        { key: 'id', label: 'Post ID' },
        { key: 'message', label: 'Message' },
        { key: 'created_time', label: 'Created Time', format: 'datetime' },
        { key: 'scheduled_publish_time', label: 'Scheduled Publish Time (Unix seconds)', format: 'number' },
        { key: 'permalink_url', label: 'Permalink', format: 'url' },
        { key: 'is_published', label: 'Published', format: 'boolean' },
      ],
    },
    ...pageMetaFields,
  ],
};

export const pagePhotosOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Photos',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Photo ID' },
        { key: 'name', label: 'Caption' },
        { key: 'created_time', label: 'Created Time', format: 'datetime' },
        { key: 'updated_time', label: 'Updated Time', format: 'datetime' },
        { key: 'link', label: 'Link', format: 'url' },
        { key: 'width', label: 'Width', format: 'number' },
        { key: 'height', label: 'Height', format: 'number' },
        {
          key: 'images',
          label: 'Image Sizes',
          listItems: [
            { key: 'source', label: 'Image', format: 'image' },
            { key: 'width', label: 'Width', format: 'number' },
            { key: 'height', label: 'Height', format: 'number' },
          ],
        },
        {
          key: 'album',
          label: 'Album',
          children: [
            { key: 'id', label: 'Album ID' },
            { key: 'name', label: 'Album Name' },
          ],
        },
      ],
    },
    ...pageMetaFields,
  ],
};

export const pageVideosOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Videos',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'Video ID' },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'created_time', label: 'Created Time', format: 'datetime' },
        { key: 'updated_time', label: 'Updated Time', format: 'datetime' },
        { key: 'length', label: 'Length (seconds)', format: 'number' },
        { key: 'permalink_url', label: 'Permalink Path' },
        { key: 'picture', label: 'Thumbnail', format: 'image' },
      ],
    },
    ...pageMetaFields,
  ],
};

export const postReactionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'object_id', label: 'Post ID' },
    { key: 'type', label: 'Reaction Type' },
    { key: 'total_count', label: 'Total Reactions', format: 'number' },
  ],
};
