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

const linkedPostFields: OutputSchema['fields'] = [
  { key: 'url', label: 'Post Link', format: 'url' },
  ...postFields,
];

const profileFields: OutputSchema['fields'] = [
  { key: 'did', label: 'DID' },
  { key: 'handle', label: 'Handle' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'description', label: 'Bio' },
  { key: 'avatar', label: 'Avatar', format: 'image' },
  { key: 'url', label: 'Profile Link', format: 'url' },
  { key: 'createdAt', label: 'Account Created At', format: 'datetime' },
  { key: 'indexedAt', label: 'Indexed At', format: 'datetime' },
  {
    key: 'viewer',
    label: 'Viewer State',
    description: 'The connected account\'s relationship to this account: following/followedBy/blocking hold record URIs when set, muted is true when muted.',
  },
];

const listedPostFields: OutputSchema['fields'] = [
  { key: 'text', label: 'Text' },
  ...linkedPostFields,
];

const feedItemFields: OutputSchema['fields'] = [
  ...listedPostFields,
  { key: 'isRepost', label: 'Is Repost', format: 'boolean' },
  { key: 'repostedBy', label: 'Reposted By', children: authorFields, description: 'Who reposted it into the feed; null when not a repost.' },
  { key: 'repostedAt', label: 'Reposted At', format: 'datetime' },
  { key: 'isReply', label: 'Is Reply', format: 'boolean' },
  { key: 'replyToUri', label: 'Replied-To Post URI' },
  { key: 'isPinned', label: 'Is Pinned', format: 'boolean' },
];

const notificationFields: OutputSchema['fields'] = [
  { key: 'reason', label: 'Type', description: 'like, repost, follow, mention, reply, quote, starterpack-joined, like-via-repost, repost-via-repost, subscribed-post, verified or unverified.' },
  { key: 'text', label: 'Text', description: 'The text of the post behind the notification; empty for likes, reposts and follows.' },
  { key: 'author', label: 'From', children: profileFields },
  { key: 'url', label: 'Post Link', format: 'url', description: 'Link to the mentioning, replying or quoting post; empty for likes, reposts and follows.' },
  { key: 'reasonSubject', label: 'Subject URI', description: 'The post that was liked, reposted, replied to or quoted; null for follows and mentions.' },
  { key: 'isRead', label: 'Is Read', format: 'boolean' },
  { key: 'indexedAt', label: 'Indexed At', format: 'datetime' },
  { key: 'uri', label: 'Record URI', description: 'URI of the like, repost, follow or post record that caused the notification.' },
  { key: 'cid', label: 'Record CID' },
];

const listViewFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'purpose', label: 'Kind', description: 'app.bsky.graph.defs#curatelist (user list), #modlist (moderation list) or #referencelist (starter pack).' },
  { key: 'description', label: 'Description' },
  { key: 'listItemCount', label: 'Members', format: 'number' },
  { key: 'url', label: 'List Link', format: 'url' },
  { key: 'uri', label: 'List URI' },
  { key: 'avatar', label: 'Avatar', format: 'image' },
  { key: 'indexedAt', label: 'Indexed At', format: 'datetime' },
  { key: 'creator', label: 'Owner', children: profileFields },
];

const pageFields: OutputSchema['fields'] = [
  { key: 'cursor', label: 'Next Page Cursor', description: 'Pass to Cursor to get the next page; null on the last page.' },
  { key: 'hasMore', label: 'Has More', format: 'boolean' },
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
    {
      key: 'failedThreadPosts',
      label: 'Failed Thread Posts',
      labelKey: 'index',
      description: 'Thread posts Bluesky rejected, with their position (1 = first thread post) and the error; empty when every post went out.',
      listItems: [
        { key: 'index', label: 'Position', format: 'number' },
        { key: 'error', label: 'Error' },
      ],
    },
    { key: 'url', label: 'Post Link', format: 'url' },
    { key: 'totalPosts', label: 'Total Posts', format: 'number' },
    { key: 'record', label: 'Post', children: recordFields },
  ],
};

export const findPostOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'uri', label: 'Post URI' },
    { key: 'url', label: 'Post Link', format: 'url' },
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
    { key: 'postUrl', label: 'Post Link', format: 'url' },
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
        { key: 'url', label: 'Post Link', format: 'url' },
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
    ...linkedPostFields,
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
    ...linkedPostFields,
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
    ...linkedPostFields,
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
    { key: 'url', label: 'Profile Link', format: 'url' },
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

export const deletePostOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'existed', label: 'Existed Before', format: 'boolean', description: 'False when the post was already gone.' },
    { key: 'uri', label: 'Post URI' },
    { key: 'deletedAt', label: 'Deleted At', format: 'datetime' },
  ],
};

export const unlikePostOutputSchema: OutputSchema = {
  fields: [
    { key: 'removed', label: 'Removed', format: 'boolean', description: 'False when the post was not liked.' },
    { key: 'postUri', label: 'Post URI' },
    { key: 'likeUri', label: 'Removed Like URI' },
  ],
};

export const undoRepostOutputSchema: OutputSchema = {
  fields: [
    { key: 'removed', label: 'Removed', format: 'boolean', description: 'False when the post was not reposted.' },
    { key: 'postUri', label: 'Post URI' },
    { key: 'repostUri', label: 'Removed Repost URI' },
  ],
};

export const profileOutputSchema: OutputSchema = {
  fields: [
    ...profileFields,
    { key: 'banner', label: 'Banner', format: 'image' },
    { key: 'followersCount', label: 'Followers', format: 'number' },
    { key: 'followsCount', label: 'Following', format: 'number' },
    { key: 'postsCount', label: 'Posts', format: 'number' },
    { key: 'pinnedPost', label: 'Pinned Post', children: [{ key: 'uri', label: 'Post URI' }], description: 'Null when nothing is pinned.' },
  ],
};

export const profileListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Accounts', labelKey: 'handle', listItems: profileFields },
    ...pageFields,
  ],
};

export const likeListOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Likes',
      labelKey: 'handle',
      listItems: [...profileFields, { key: 'likedAt', label: 'Liked At', format: 'datetime' }],
    },
    ...pageFields,
  ],
};

export const postListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Posts', labelKey: 'text', listItems: listedPostFields },
    ...pageFields,
  ],
};

export const feedListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Posts', labelKey: 'text', listItems: feedItemFields },
    ...pageFields,
  ],
};

export const followOutputSchema: OutputSchema = {
  fields: [
    { key: 'followUri', label: 'Follow URI' },
    { key: 'did', label: 'DID' },
    { key: 'handle', label: 'Handle' },
    { key: 'alreadyFollowing', label: 'Already Following', format: 'boolean' },
  ],
};

export const unfollowOutputSchema: OutputSchema = {
  fields: [
    { key: 'removed', label: 'Removed', format: 'boolean', description: 'False when the account was not followed.' },
    { key: 'did', label: 'DID' },
    { key: 'handle', label: 'Handle' },
    { key: 'followUri', label: 'Removed Follow URI' },
  ],
};

export const blockOutputSchema: OutputSchema = {
  fields: [
    { key: 'blockUri', label: 'Block URI' },
    { key: 'did', label: 'DID' },
    { key: 'handle', label: 'Handle' },
    { key: 'alreadyBlocked', label: 'Already Blocked', format: 'boolean' },
  ],
};

export const unblockOutputSchema: OutputSchema = {
  fields: [
    { key: 'removed', label: 'Removed', format: 'boolean', description: 'False when the account was not blocked.' },
    { key: 'did', label: 'DID' },
    { key: 'handle', label: 'Handle' },
    { key: 'blockUri', label: 'Removed Block URI' },
  ],
};

export const muteOutputSchema: OutputSchema = {
  fields: [
    { key: 'muted', label: 'Muted Now', format: 'boolean' },
    { key: 'wasMuted', label: 'Was Muted Before', format: 'boolean' },
    { key: 'did', label: 'DID' },
    { key: 'handle', label: 'Handle' },
  ],
};

export const notificationListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Notifications', labelKey: 'reason', listItems: notificationFields },
    ...pageFields,
    { key: 'seenAt', label: 'Last Seen At', format: 'datetime' },
  ],
};

export const markSeenOutputSchema: OutputSchema = {
  fields: [{ key: 'seenAt', label: 'Seen Up To', format: 'datetime' }],
};

export const updateProfileOutputSchema: OutputSchema = {
  fields: [
    { key: 'did', label: 'DID' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'description', label: 'Bio' },
    { key: 'avatarUpdated', label: 'Avatar Updated', format: 'boolean' },
    { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  ],
};

export const listListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Lists', labelKey: 'name', listItems: listViewFields },
    ...pageFields,
  ],
};

export const listMembersOutputSchema: OutputSchema = {
  fields: [
    { key: 'list', label: 'List', children: listViewFields },
    {
      key: 'items',
      label: 'Members',
      labelKey: 'handle',
      listItems: [...profileFields, { key: 'listItemUri', label: 'Membership URI' }],
    },
    ...pageFields,
  ],
};

export const createListOutputSchema: OutputSchema = {
  fields: [
    { key: 'uri', label: 'List URI' },
    { key: 'url', label: 'List Link', format: 'url' },
    { key: 'cid', label: 'CID' },
    { key: 'name', label: 'Name' },
    { key: 'purpose', label: 'Kind' },
    { key: 'description', label: 'Description' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
  ],
};

export const deleteListOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'existed', label: 'Existed Before', format: 'boolean' },
    { key: 'uri', label: 'List URI' },
    { key: 'membersRemoved', label: 'Memberships Removed', format: 'number' },
    { key: 'membersFailed', label: 'Memberships Not Removed', format: 'number' },
    { key: 'membersComplete', label: 'All Memberships Found', format: 'boolean', description: 'True once every membership record of the list was removed before the list was deleted.' },
  ],
};

export const addListMemberOutputSchema: OutputSchema = {
  fields: [
    { key: 'listItemUri', label: 'Membership URI' },
    { key: 'listItemCid', label: 'Membership CID' },
    { key: 'listUri', label: 'List URI' },
    { key: 'did', label: 'Member DID' },
  ],
};

export const removeListMemberOutputSchema: OutputSchema = {
  fields: [
    { key: 'removed', label: 'Memberships Removed', format: 'number' },
    { key: 'listUri', label: 'List URI' },
    { key: 'did', label: 'Member DID' },
  ],
};

export const aiCreatePostOutputSchema: OutputSchema = {
  fields: [
    { key: 'uri', label: 'Post URI' },
    { key: 'cid', label: 'CID' },
    { key: 'url', label: 'Post Link', format: 'url' },
    { key: 'isReply', label: 'Is Reply', format: 'boolean' },
    { key: 'quotedUri', label: 'Quoted Post URI' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
  ],
};

export const aiLikeOutputSchema: OutputSchema = {
  fields: [
    { key: 'likeUri', label: 'Like URI' },
    { key: 'postUri', label: 'Post URI' },
    { key: 'postCid', label: 'Post CID' },
    { key: 'postUrl', label: 'Post Link', format: 'url' },
    { key: 'alreadyLiked', label: 'Already Liked', format: 'boolean' },
  ],
};

export const aiRepostOutputSchema: OutputSchema = {
  fields: [
    { key: 'repostUri', label: 'Repost URI' },
    { key: 'postUri', label: 'Post URI' },
    { key: 'postCid', label: 'Post CID' },
    { key: 'postUrl', label: 'Post Link', format: 'url' },
    { key: 'alreadyReposted', label: 'Already Reposted', format: 'boolean' },
  ],
};

export const getPostsOutputSchema: OutputSchema = {
  fields: [
    { key: 'posts', label: 'Posts', labelKey: 'text', listItems: listedPostFields },
    { key: 'notFound', label: 'Not Found', description: 'Inputs whose post is deleted or not visible to this account.' },
  ],
};

export const resolveHandleOutputSchema: OutputSchema = {
  fields: [
    { key: 'handle', label: 'Handle' },
    { key: 'did', label: 'DID' },
  ],
};

export const unreadCountOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Unread Notifications', format: 'number' },
    { key: 'checkedAt', label: 'Checked At', format: 'datetime' },
  ],
};

export const notificationTriggerOutputSchema: OutputSchema = {
  fields: notificationFields,
};

export const mentionTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'notificationReason', label: 'Why', description: 'mention, reply or quote.' },
    ...listedPostFields,
    { key: 'replyToUri', label: 'Replied-To Post URI' },
    { key: 'reasonSubject', label: 'Your Post URI', description: 'Your post that was replied to or quoted; null for mentions.' },
    { key: 'isRead', label: 'Is Read', format: 'boolean' },
    {
      key: 'postAvailable',
      label: 'Post Available',
      format: 'boolean',
      description: 'False when the post was deleted or hidden before the poll; the post fields then come from the notification and the counts are null.',
    },
  ],
};
