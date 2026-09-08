import { OutputSchema } from '@activepieces/pieces-framework';

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
