import { OutputSchema } from '@activepieces/pieces-framework';

const userPublicMetricsFields: OutputSchema['fields'] = [
  { key: 'followers_count', label: 'Followers', format: 'number' },
  { key: 'following_count', label: 'Following', format: 'number' },
  { key: 'tweet_count', label: 'Posts', format: 'number' },
  { key: 'listed_count', label: 'Listed In', format: 'number' },
  { key: 'like_count', label: 'Likes Given', format: 'number' },
  { key: 'media_count', label: 'Media Posted', format: 'number' },
];

const userFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Display Name' },
  { key: 'description', label: 'Bio' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'profile_image_url', label: 'Profile Image', format: 'image' },
  { key: 'verified', label: 'Verified', format: 'boolean' },
  {
    key: 'public_metrics',
    label: 'Public Metrics',
    children: userPublicMetricsFields,
  },
];

export const getAuthenticatedUserOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Account',
      description: 'The X account this connection authenticates as.',
      children: userFields,
    },
  ],
};
