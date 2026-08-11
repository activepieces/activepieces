import { OutputSchema } from '@activepieces/pieces-framework';

const authorFields: OutputSchema['fields'] = [
  { key: 'did', label: 'Author DID' },
  { key: 'handle', label: 'Handle' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'avatar', label: 'Avatar', format: 'image' },
];

const recordFields: OutputSchema['fields'] = [
  { key: 'text', label: 'Text' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  {
    key: 'embed',
    label: 'Embed',
    description: 'Media carried by the record itself — image/video blob refs, external link card or quoted post.',
  },
  {
    key: 'langs',
    label: 'Languages',
    description: 'BCP-47 language codes declared on the post.',
  },
  {
    key: 'tags',
    label: 'Tags',
    description: 'Hashtags stored on the record, without the leading #.',
  },
  {
    key: 'reply',
    label: 'Reply Refs',
    description: 'The root and parent post refs when the record is a reply.',
  },
];

const postEngagementFields: OutputSchema['fields'] = [
  {
    key: 'embed',
    label: 'Embed',
    description: 'Media attached to the post — images, video, external link card or quoted post. Shape varies by embed type.',
  },
  {
    key: 'labels',
    label: 'Labels',
    description: 'Moderation labels applied to the post.',
  },
  {
    key: 'viewer',
    label: 'Viewer State',
    description: 'The authenticated account\'s relationship to the post, such as the URIs of its own like and repost.',
  },
];

const mediaFlagFields: OutputSchema['fields'] = [
  { key: 'hasImages', label: 'Has Images', format: 'boolean' },
  { key: 'hasVideo', label: 'Has Video', format: 'boolean' },
  { key: 'hasExternalLink', label: 'Has External Link', format: 'boolean' },
];

const postRefFields: OutputSchema['fields'] = [
  { key: 'uri', label: 'Post URI' },
  { key: 'cid', label: 'CID' },
  { key: 'author', label: 'Author', children: authorFields },
];

const postFields: OutputSchema['fields'] = [
  { key: 'uri', label: 'Post URI' },
  { key: 'cid', label: 'CID' },
  { key: 'author', label: 'Author', children: authorFields },
  { key: 'record', label: 'Post', children: recordFields },
  { key: 'indexedAt', label: 'Indexed At', format: 'datetime' },
  { key: 'replyCount', label: 'Reply Count', format: 'number' },
  { key: 'repostCount', label: 'Repost Count', format: 'number' },
  { key: 'likeCount', label: 'Like Count', format: 'number' },
  { key: 'quoteCount', label: 'Quote Count', format: 'number' },
  ...postEngagementFields,
];

export const createPostOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'mainPost',
      label: 'Main Post',
      children: [
        { key: 'uri', label: 'Post URI' },
        { key: 'cid', label: 'CID' },
      ],
    },
    {
      key: 'threadPosts',
      label: 'Thread Posts',
      labelKey: 'uri',
      description: 'The follow-up posts of a thread, in order; empty for a single post.',
      listItems: [
        { key: 'uri', label: 'Post URI' },
        { key: 'cid', label: 'CID' },
      ],
    },
    { key: 'totalPosts', label: 'Total Posts', format: 'number' },
    { key: 'record', label: 'Post', children: recordFields },
  ],
};

export const findPostOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'uri', label: 'Post URI' },
    { key: 'cid', label: 'CID' },
    { key: 'record', label: 'Post', children: recordFields },
    { key: 'author', label: 'Author', children: authorFields },
    { key: 'indexedAt', label: 'Indexed At', format: 'datetime' },
    { key: 'replyCount', label: 'Reply Count', format: 'number' },
    { key: 'repostCount', label: 'Repost Count', format: 'number' },
    { key: 'likeCount', label: 'Like Count', format: 'number' },
    { key: 'quoteCount', label: 'Quote Count', format: 'number' },
    ...postEngagementFields,
    {
      key: 'threadgate',
      label: 'Threadgate',
      description: 'The reply restrictions set on the post; absent when replies are open to everyone.',
    },
    { key: 'retrievedAt', label: 'Retrieved At', format: 'datetime' },
  ],
};

export const likePostOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'likeUri', label: 'Like URI' },
    { key: 'likeCid', label: 'Like CID' },
    { key: 'postUri', label: 'Post URI' },
    { key: 'postCid', label: 'Post CID' },
    { key: 'postAuthor', label: 'Post Author' },
    { key: 'postText', label: 'Post Text' },
    {
      key: 'selectionMethod',
      label: 'Selection Method',
      description: 'How the post was chosen — timeline or manual.',
    },
    { key: 'likedAt', label: 'Liked At', format: 'datetime' },
  ],
};

export const repostOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'repostUri', label: 'Repost URI' },
    { key: 'repostCid', label: 'Repost CID' },
    {
      key: 'originalPost',
      label: 'Original Post',
      children: [
        { key: 'uri', label: 'Post URI' },
        { key: 'cid', label: 'CID' },
        { key: 'author', label: 'Author Handle' },
        { key: 'text', label: 'Text' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
      ],
    },
    {
      key: 'selectionMethod',
      label: 'Selection Method',
      description: 'How the post was chosen — timeline or manual.',
    },
    { key: 'repostedAt', label: 'Reposted At', format: 'datetime' },
  ],
};

export const findThreadOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'thread',
      label: 'Thread',
      children: [
        { key: 'post', label: 'Root Post', children: postFields },
        {
          key: 'parent',
          label: 'Parent Thread',
          description: 'The parent post chain above this one, nested up to the requested parent height; absent at the top of a thread.',
        },
        {
          key: 'replies',
          label: 'Replies',
          description: 'Nested reply threads, each with its own post and replies.',
        },
      ],
    },
    { key: 'requestedUri', label: 'Requested URI' },
    {
      key: 'parameters',
      label: 'Parameters',
      children: [
        { key: 'depth', label: 'Depth', format: 'number' },
        { key: 'parentHeight', label: 'Parent Height', format: 'number' },
      ],
    },
    {
      key: 'statistics',
      label: 'Statistics',
      children: [
        { key: 'totalPosts', label: 'Total Posts', format: 'number' },
        { key: 'parentPosts', label: 'Parent Posts', format: 'number' },
        { key: 'replyPosts', label: 'Reply Posts', format: 'number' },
        { key: 'notFoundPosts', label: 'Not Found Posts', format: 'number' },
        { key: 'blockedPosts', label: 'Blocked Posts', format: 'number' },
      ],
    },
    { key: 'retrievedAt', label: 'Retrieved At', format: 'datetime' },
  ],
};

export const newPostTriggerOutputSchema: OutputSchema = {
  fields: [
    ...postFields,
    {
      key: 'searchContext',
      label: 'Search Context',
      children: [
        { key: 'query', label: 'Query' },
        {
          key: 'language',
          label: 'Language',
          description: 'The language filter the search ran with; null when unset.',
        },
        { key: 'matchedTerms', label: 'Matched Terms' },
        ...mediaFlagFields,
      ],
    },
  ],
};

export const newTimelinePostsTriggerOutputSchema: OutputSchema = {
  fields: [
    ...postFields,
    {
      key: 'reason',
      label: 'Timeline Reason',
      description: 'Why the item is in the timeline — carries the reposting account when it is a repost. Feed Context below exposes the same information flattened.',
    },
    {
      key: 'reply',
      label: 'Reply Refs',
      description: 'The root and parent post refs when the item is a reply. Feed Context below exposes the same information flattened.',
    },
    {
      key: 'feedContext',
      label: 'Feed Context',
      children: [
        { key: 'isRepost', label: 'Is Repost', format: 'boolean' },
        {
          key: 'repostBy',
          label: 'Reposted By',
          children: authorFields,
          description: 'Who reposted this into the timeline; null when not a repost.',
        },
        { key: 'isReply', label: 'Is Reply', format: 'boolean' },
        {
          key: 'replyToPost',
          label: 'Replied-To Post',
          children: postRefFields,
          description: 'The post this one replies to; null when not a reply.',
        },
        {
          key: 'replyToRoot',
          label: 'Thread Root Post',
          children: postRefFields,
          description: 'The root post of the reply thread; null when not a reply.',
        },
      ],
    },
  ],
};

export const newPostsByAuthorTriggerOutputSchema: OutputSchema = {
  fields: [
    ...postFields,
    {
      key: 'postContext',
      label: 'Post Context',
      children: [
        { key: 'authorHandle', label: 'Author Handle' },
        { key: 'isReply', label: 'Is Reply', format: 'boolean' },
        {
          key: 'replyTo',
          label: 'Replied-To Post URI',
          description: 'URI of the post this one replies to; null when not a reply.',
        },
        { key: 'isRepost', label: 'Is Repost', format: 'boolean' },
        ...mediaFlagFields,
      ],
    },
  ],
};

export const newFollowerTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'did', label: 'Follower DID' },
    { key: 'handle', label: 'Handle' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'description', label: 'Bio' },
    { key: 'avatar', label: 'Avatar', format: 'image' },
    // followersCount/followsCount/postsCount are deliberately absent: the
    // trigger reads getFollowers(), whose ProfileView never carries the
    // counts, so the emitted values are a hardcoded 0
    { key: 'indexedAt', label: 'Indexed At', format: 'datetime' },
    { key: 'createdAt', label: 'Account Created At', format: 'datetime' },
    {
      key: 'viewer',
      label: 'Viewer State',
      description: 'The authenticated account\'s relationship to this follower — following/followedBy carry the follow record URIs, which is how you branch on whether to follow back.',
    },
    {
      key: 'labels',
      label: 'Labels',
      description: 'Moderation labels applied to the follower\'s account.',
    },
  ],
};
