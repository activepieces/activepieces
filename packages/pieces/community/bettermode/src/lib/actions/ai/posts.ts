import { createAction, Property } from '@activepieces/pieces-framework';
import { bettermodeAuth } from '../../auth';
import { bindTokenStore, bettermodeQuery, BettermodeCredentials, readPath } from '../../common/client';
import { bettermodeAiProps } from '../../common/ai-props';
import { PAGE_INFO, POST_FIELDS, POST_TYPE_FIELDS, TAG_FIELDS } from '../../common/fields';
import { bettermodeInput } from '../../common/input';
import { bettermodeMap } from '../../common/mappers';
import { bettermodeOps } from '../../common/operations';
import { bettermodeSchemas } from '../../common/schemas';

export const listPostTypesAction = createAction({
  auth: bettermodeAuth,
  name: 'list_post_types',
  classification: 'SEARCH',
  displayName: 'List Post Types',
  description: 'List the post types (Discussion, Question, Article...) of the community.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists post types with their IDs, one page at a time. Use to get the Post Type ID that Create Post needs; set Context to reply to get reply/comment types. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    context: Property.StaticDropdown({
      displayName: 'Context',
      description: 'post for top-level post types, reply for reply types. Leave empty for both.',
      required: false,
      options: {
        options: [
          { label: 'Post', value: 'post' },
          { label: 'Reply', value: 'reply' },
        ],
      },
    }),
    query: Property.ShortText({ displayName: 'Search', description: 'Filter post types by name.', required: false }),
    limit: bettermodeAiProps.limit(),
    cursor: bettermodeAiProps.cursor(),
  },
  outputSchema: bettermodeSchemas.postTypes,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const context = bettermodeInput.optionalText(propsValue.context);
    if (context !== undefined && context !== 'post' && context !== 'reply') {
      throw new Error('Context must be post or reply.');
    }
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `query ListPostTypes($limit: Int!, $after: String, $context: PostTypeContext, $query: String) {
  postTypes(limit: $limit, after: $after, context: $context, query: $query) {
    nodes {
${POST_TYPE_FIELDS}
    }
    ${PAGE_INFO}
  }
}`,
      variables: {
        limit: bettermodeInput.limit({ value: propsValue.limit }),
        after: bettermodeInput.optionalText(propsValue.cursor) ?? null,
        context,
        query: bettermodeInput.optionalText(propsValue.query),
      },
    });
    return bettermodeMap.page({ value: data['postTypes'], map: bettermodeMap.postType });
  },
});

export const listPostsAction = createAction({
  auth: bettermodeAuth,
  name: 'list_posts',
  classification: 'SEARCH',
  displayName: 'List Posts',
  description: 'List posts, optionally limited to spaces and post types.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists posts (newest activity order chosen by Order By) one page at a time, optionally only in given spaces or of given post types. Use to browse recent posts; use Search Posts for keyword search. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    space_ids: Property.Array({ displayName: 'Space IDs', description: 'Only posts in these spaces.', required: false }),
    post_type_ids: Property.Array({
      displayName: 'Post Type IDs',
      description: 'Only posts of these post types (from List Post Types).',
      required: false,
    }),
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Sort field. Defaults to createdAt.',
      required: false,
      options: {
        options: [
          { label: 'Created At', value: 'createdAt' },
          { label: 'Published At', value: 'publishedAt' },
          { label: 'Last Activity', value: 'lastActivityAt' },
          { label: 'Updated At', value: 'updatedAt' },
          { label: 'Replies Count', value: 'repliesCount' },
          { label: 'Reactions Count', value: 'reactionsCount' },
        ],
      },
    }),
    reverse: Property.Checkbox({
      displayName: 'Reverse Order',
      description: 'Reverse the sort direction.',
      required: false,
    }),
    limit: bettermodeAiProps.limit(),
    cursor: bettermodeAiProps.cursor(),
  },
  outputSchema: bettermodeSchemas.posts,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const spaceIds = bettermodeInput.stringList({ value: propsValue.space_ids, label: 'Space IDs' });
    const postTypeIds = bettermodeInput.stringList({ value: propsValue.post_type_ids, label: 'Post Type IDs' });
    const orderBy = bettermodeInput.optionalText(propsValue.order_by) ?? 'createdAt';
    if (!ORDER_BY_VALUES.includes(orderBy)) {
      throw new Error(`Order By must be one of ${ORDER_BY_VALUES.join(', ')}.`);
    }
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `query ListPosts($limit: Int!, $after: String, $spaceIds: [ID!], $postTypeIds: [String!], $orderBy: PostListOrderByEnum, $reverse: Boolean) {
  posts(limit: $limit, after: $after, spaceIds: $spaceIds, postTypeIds: $postTypeIds, orderBy: $orderBy, reverse: $reverse) {
    nodes {
${POST_FIELDS}
    }
    ${PAGE_INFO}
  }
}`,
      variables: {
        limit: bettermodeInput.limit({ value: propsValue.limit }),
        after: bettermodeInput.optionalText(propsValue.cursor) ?? null,
        spaceIds: spaceIds.length > 0 ? spaceIds : undefined,
        postTypeIds: postTypeIds.length > 0 ? postTypeIds : undefined,
        orderBy,
        reverse: bettermodeInput.optionalBoolean({ value: propsValue.reverse, label: 'Reverse Order' }),
      },
    });
    return bettermodeMap.page({ value: data['posts'], map: bettermodeMap.post });
  },
});

export const searchPostsAction = createAction({
  auth: bettermodeAuth,
  name: 'search_posts',
  classification: 'SEARCH',
  displayName: 'Search Posts',
  description: 'Search posts by keyword.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Full-text search over posts the connected member can see, one page at a time. Use when you know words from the title or content; use List Posts to browse a space. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Search Text', description: 'Words to search for.', required: true }),
    limit: bettermodeAiProps.limit(),
    cursor: bettermodeAiProps.cursor(),
  },
  outputSchema: bettermodeSchemas.posts,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `query SearchPosts($query: String!, $limit: Int!, $after: String) {
  searchPosts(query: $query, limit: $limit, after: $after) {
    nodes {
${POST_FIELDS}
    }
    ${PAGE_INFO}
  }
}`,
      variables: {
        query: bettermodeInput.requireText({ value: propsValue.query, label: 'Search Text' }),
        limit: bettermodeInput.limit({ value: propsValue.limit }),
        after: bettermodeInput.optionalText(propsValue.cursor) ?? null,
      },
    });
    return bettermodeMap.page({ value: data['searchPosts'], map: bettermodeMap.post });
  },
});

export const getPostAction = createAction({
  auth: bettermodeAuth,
  name: 'get_post',
  classification: 'READ',
  displayName: 'Get Post',
  description: 'Get a post or reply by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one post or reply by ID with title, HTML content, tags, author and counts. Use to read a post before replying to or updating it. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    post_id: bettermodeAiProps.id({ displayName: 'Post ID', description: 'The post ID.' }),
  },
  outputSchema: bettermodeSchemas.post,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const post = await fetchPost({
      auth: auth.props,
      postId: bettermodeInput.requireText({ value: propsValue.post_id, label: 'Post ID' }),
    });
    return bettermodeMap.post(post);
  },
});

export const createPostAction = createAction({
  auth: bettermodeAuth,
  name: 'create_post',
  classification: 'WRITE',
  displayName: 'Create Post',
  description: 'Publish a post of any post type in a space.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publishes a new post in a space with a title, HTML content and optional tags. Needs the Space ID (List Spaces) and Post Type ID (List Post Types). Each call creates a separate post, so retries duplicate.',
    idempotent: false,
  },
  props: {
    space_id: bettermodeAiProps.id({ displayName: 'Space ID', description: 'The space to post in.' }),
    post_type_id: bettermodeAiProps.id({ displayName: 'Post Type ID', description: 'The post type ID (from List Post Types).' }),
    title: Property.ShortText({ displayName: 'Title', description: 'The post title.', required: true }),
    content: Property.LongText({ displayName: 'Content', description: 'The post body. HTML is supported.', required: true }),
    tag_names: Property.Array({ displayName: 'Tags', description: 'Tag names to add. New names create tags.', required: false }),
    locked: Property.Checkbox({ displayName: 'Locked', description: 'Lock the post so nobody can reply.', required: false }),
  },
  outputSchema: bettermodeSchemas.post,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    return bettermodeOps.createPost({
      auth: auth.props,
      spaceId: bettermodeInput.requireText({ value: propsValue.space_id, label: 'Space ID' }),
      postTypeId: bettermodeInput.requireText({ value: propsValue.post_type_id, label: 'Post Type ID' }),
      title: bettermodeInput.requireText({ value: propsValue.title, label: 'Title' }),
      content: bettermodeInput.requireText({ value: propsValue.content, label: 'Content' }),
      tagNames: bettermodeOps.tagNames(propsValue.tag_names),
      locked: bettermodeInput.optionalBoolean({ value: propsValue.locked, label: 'Locked' }),
    });
  },
});

export const updatePostAction = createAction({
  auth: bettermodeAuth,
  name: 'update_post',
  classification: 'WRITE',
  displayName: 'Update Post',
  description: 'Change the title, content, tags or lock state of a post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the fields you give on an existing post or reply: title, HTML content, tags (replaces the tag list; Clear Tags removes all) and lock state. Use Get Post first if you need the current text. Setting the same values again changes nothing, so retries are safe.',
    idempotent: true,
  },
  props: {
    post_id: bettermodeAiProps.id({ displayName: 'Post ID', description: 'The post to update.' }),
    title: Property.ShortText({ displayName: 'Title', description: 'New title. Leave empty to keep it.', required: false }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'New HTML body. Leave empty to keep it.',
      required: false,
    }),
    tag_names: Property.Array({
      displayName: 'Tags',
      description: 'Replaces all tags with these names. Leave empty to keep the tags.',
      required: false,
    }),
    clear_tags: Property.Checkbox({ displayName: 'Clear Tags', description: 'Remove all tags.', required: false }),
    lock: Property.StaticDropdown({
      displayName: 'Lock State',
      description: 'Lock or unlock replies. Leave empty to keep it.',
      required: false,
      options: {
        options: [
          { label: 'Lock', value: 'lock' },
          { label: 'Unlock', value: 'unlock' },
        ],
      },
    }),
  },
  outputSchema: bettermodeSchemas.post,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const postId = bettermodeInput.requireText({ value: propsValue.post_id, label: 'Post ID' });
    const title = bettermodeInput.optionalText(propsValue.title);
    const content = typeof propsValue.content === 'string' && propsValue.content.trim().length > 0 ? propsValue.content : undefined;
    const tags = bettermodeOps.tagNames(propsValue.tag_names);
    const clearTags = bettermodeInput.optionalBoolean({ value: propsValue.clear_tags, label: 'Clear Tags' }) === true;
    const lock = bettermodeInput.optionalText(propsValue.lock);
    if (clearTags && tags.length > 0) {
      throw new Error('Give Tags or Clear Tags, not both.');
    }
    if (lock !== undefined && lock !== 'lock' && lock !== 'unlock') {
      throw new Error('Lock State must be lock or unlock.');
    }
    const mappingFields = [
      ...(title === undefined ? [] : [{ key: 'title', type: 'text', value: JSON.stringify(title) }]),
      ...(content === undefined ? [] : [{ key: 'content', type: 'html', value: JSON.stringify(content) }]),
    ];
    const input: Record<string, unknown> = {};
    if (mappingFields.length > 0) {
      input['mappingFields'] = mappingFields;
    }
    if (clearTags) {
      input['tagNames'] = [];
    } else if (tags.length > 0) {
      input['tagNames'] = tags;
    }
    if (lock !== undefined) {
      input['locked'] = lock === 'lock';
    }
    if (Object.keys(input).length === 0) {
      throw new Error('Give at least one field to update.');
    }
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
  updatePost(id: $id, input: $input) {
${POST_FIELDS}
  }
}`,
      variables: { id: postId, input },
    });
    return bettermodeMap.post(data['updatePost']);
  },
});

export const deletePostAction = createAction({
  auth: bettermodeAuth,
  name: 'delete_post',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Post',
  description: 'Permanently delete a post or reply.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a post or reply and its replies. Only call when the user asked to delete this exact post; use Hide Post to take it out of view reversibly. A second call fails because the post is gone.',
    idempotent: false,
  },
  props: {
    post_id: bettermodeAiProps.id({ displayName: 'Post ID', description: 'The post to delete.' }),
  },
  outputSchema: bettermodeSchemas.deleted,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const postId = bettermodeInput.requireText({ value: propsValue.post_id, label: 'Post ID' });
    const status = await bettermodeOps.runActionMutation({
      auth: auth.props,
      query: `mutation DeletePost($id: ID!) {
  deletePost(id: $id) {
    status
  }
}`,
      variables: { id: postId },
      field: 'deletePost',
    });
    return { id: postId, deleted: true, status };
  },
});

export const listRepliesAction = createAction({
  auth: bettermodeAuth,
  name: 'list_replies',
  classification: 'SEARCH',
  displayName: 'List Replies',
  description: 'List the replies of a post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists replies to one post (or to one reply, for nested threads), one page at a time. Use to read a discussion before answering. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    post_id: bettermodeAiProps.id({ displayName: 'Post ID', description: 'The post whose replies to list.' }),
    limit: bettermodeAiProps.limit(),
    cursor: bettermodeAiProps.cursor(),
  },
  outputSchema: bettermodeSchemas.posts,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `query ListReplies($postId: ID!, $limit: Int!, $after: String) {
  replies(postId: $postId, limit: $limit, after: $after) {
    nodes {
${POST_FIELDS}
    }
    ${PAGE_INFO}
  }
}`,
      variables: {
        postId: bettermodeInput.requireText({ value: propsValue.post_id, label: 'Post ID' }),
        limit: bettermodeInput.limit({ value: propsValue.limit }),
        after: bettermodeInput.optionalText(propsValue.cursor) ?? null,
      },
    });
    return bettermodeMap.page({ value: data['replies'], map: bettermodeMap.post });
  },
});

export const createReplyAction = createAction({
  auth: bettermodeAuth,
  name: 'create_reply',
  classification: 'WRITE',
  displayName: 'Create Reply',
  description: 'Reply to a post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a reply (comment or answer) with HTML content under a post or reply. The reply type defaults to the first reply type the parent allows. Each call adds a new reply, so retries duplicate.',
    idempotent: false,
  },
  props: {
    post_id: bettermodeAiProps.id({ displayName: 'Post ID', description: 'The post or reply to answer.' }),
    content: Property.LongText({ displayName: 'Content', description: 'The reply body. HTML is supported.', required: true }),
    reply_post_type_id: bettermodeAiProps.optionalId({
      displayName: 'Reply Post Type ID',
      description: 'Optional reply type ID (List Post Types with Context reply). Defaults to the type the parent allows.',
    }),
  },
  outputSchema: bettermodeSchemas.post,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const postId = bettermodeInput.requireText({ value: propsValue.post_id, label: 'Post ID' });
    const content = bettermodeInput.requireText({ value: propsValue.content, label: 'Content' });
    const postTypeId =
      bettermodeInput.optionalText(propsValue.reply_post_type_id) ??
      (await defaultReplyTypeId({ auth: auth.props, postId }));
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `mutation CreateReply($postId: ID!, $input: CreatePostInput!) {
  createReply(postId: $postId, input: $input) {
${POST_FIELDS}
  }
}`,
      variables: {
        postId,
        input: {
          postTypeId,
          mappingFields: [{ key: 'content', type: 'html', value: JSON.stringify(content) }],
        },
      },
    });
    return bettermodeOps.publishIfDraft({ auth: auth.props, post: bettermodeMap.post(data['createReply']) });
  },
});

export const addReactionAction = createAction({
  auth: bettermodeAuth,
  name: 'add_reaction',
  classification: 'WRITE',
  displayName: 'Add Reaction',
  description: 'React to a post as the connected member.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a reaction (for example +1, heart, or an upvote key the post type allows) to a post as the connected member. Use Remove Reaction to undo. Not verified as retry-safe.',
    idempotent: false,
  },
  props: {
    post_id: bettermodeAiProps.id({ displayName: 'Post ID', description: 'The post to react to.' }),
    reaction: Property.ShortText({
      displayName: 'Reaction',
      description: 'The reaction key, for example +1 or heart.',
      required: true,
    }),
  },
  outputSchema: bettermodeSchemas.reaction,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const postId = bettermodeInput.requireText({ value: propsValue.post_id, label: 'Post ID' });
    const reaction = bettermodeInput.requireText({ value: propsValue.reaction, label: 'Reaction' });
    const status = await bettermodeOps.runActionMutation({
      auth: auth.props,
      query: `mutation AddReaction($postId: ID!, $input: AddReactionInput!) {
  addReaction(postId: $postId, input: $input) {
    status
  }
}`,
      variables: { postId, input: { reaction } },
      field: 'addReaction',
    });
    return { success: true, status, post_id: postId, reaction };
  },
});

export const removeReactionAction = createAction({
  auth: bettermodeAuth,
  name: 'remove_reaction',
  classification: 'WRITE',
  displayName: 'Remove Reaction',
  description: "Remove the connected member's reaction from a post.",
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a reaction the connected member added to a post. Use to undo Add Reaction. Not verified as retry-safe: removing a reaction that is not there may error.',
    idempotent: false,
  },
  props: {
    post_id: bettermodeAiProps.id({ displayName: 'Post ID', description: 'The post.' }),
    reaction: Property.ShortText({ displayName: 'Reaction', description: 'The reaction key to remove.', required: true }),
  },
  outputSchema: bettermodeSchemas.reaction,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const postId = bettermodeInput.requireText({ value: propsValue.post_id, label: 'Post ID' });
    const reaction = bettermodeInput.requireText({ value: propsValue.reaction, label: 'Reaction' });
    const status = await bettermodeOps.runActionMutation({
      auth: auth.props,
      query: `mutation RemoveReaction($postId: ID!, $reaction: String!) {
  removeReaction(postId: $postId, reaction: $reaction) {
    status
  }
}`,
      variables: { postId, reaction },
      field: 'removeReaction',
    });
    return { success: true, status, post_id: postId, reaction };
  },
});

export const pinPostAction = createAction({
  auth: bettermodeAuth,
  name: 'pin_post',
  classification: 'WRITE',
  displayName: 'Pin Post',
  description: 'Pin a post to the top of its space.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pins a post to the top of its space. Use Unpin Post to undo. Needs moderator or admin rights. Not verified as retry-safe.',
    idempotent: false,
  },
  props: {
    post_id: bettermodeAiProps.id({ displayName: 'Post ID', description: 'The post ID.' }),
  },
  outputSchema: bettermodeSchemas.postAction,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const postId = bettermodeInput.requireText({ value: propsValue.post_id, label: 'Post ID' });
    const status = await bettermodeOps.runActionMutation({
      auth: auth.props,
      query: `mutation PinPost($postId: ID!) {
  pinPostToSpace(postId: $postId) {
    status
  }
}`,
      variables: { postId: postId },
      field: 'pinPostToSpace',
    });
    return { success: true, status, post_id: postId };
  },
});

export const unpinPostAction = createAction({
  auth: bettermodeAuth,
  name: 'unpin_post',
  classification: 'WRITE',
  displayName: 'Unpin Post',
  description: 'Unpin a post from its space.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a pinned post from the top of its space. Needs moderator or admin rights. Not verified as retry-safe.',
    idempotent: false,
  },
  props: {
    post_id: bettermodeAiProps.id({ displayName: 'Post ID', description: 'The post ID.' }),
  },
  outputSchema: bettermodeSchemas.postAction,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const postId = bettermodeInput.requireText({ value: propsValue.post_id, label: 'Post ID' });
    const status = await bettermodeOps.runActionMutation({
      auth: auth.props,
      query: `mutation UnpinPost($postId: ID!) {
  unpinPostFromSpace(postId: $postId) {
    status
  }
}`,
      variables: { postId: postId },
      field: 'unpinPostFromSpace',
    });
    return { success: true, status, post_id: postId };
  },
});

export const hidePostAction = createAction({
  auth: bettermodeAuth,
  name: 'hide_post',
  classification: 'WRITE',
  displayName: 'Hide Post',
  description: 'Hide a post from members.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Hides a post from regular members without deleting it; use Unhide Post to restore it. Prefer this over Delete Post when unsure. Needs moderator or admin rights.',
    idempotent: false,
  },
  props: {
    post_id: bettermodeAiProps.id({ displayName: 'Post ID', description: 'The post ID.' }),
  },
  outputSchema: bettermodeSchemas.postAction,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const postId = bettermodeInput.requireText({ value: propsValue.post_id, label: 'Post ID' });
    const status = await bettermodeOps.runActionMutation({
      auth: auth.props,
      query: `mutation HidePost($id: ID!) {
  hidePost(id: $id) {
    status
  }
}`,
      variables: { id: postId },
      field: 'hidePost',
    });
    return { success: true, status, post_id: postId };
  },
});

export const unhidePostAction = createAction({
  auth: bettermodeAuth,
  name: 'unhide_post',
  classification: 'WRITE',
  displayName: 'Unhide Post',
  description: 'Make a hidden post visible again.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Makes a hidden post visible to members again. Needs moderator or admin rights.',
    idempotent: false,
  },
  props: {
    post_id: bettermodeAiProps.id({ displayName: 'Post ID', description: 'The post ID.' }),
  },
  outputSchema: bettermodeSchemas.postAction,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const postId = bettermodeInput.requireText({ value: propsValue.post_id, label: 'Post ID' });
    const status = await bettermodeOps.runActionMutation({
      auth: auth.props,
      query: `mutation UnhidePost($id: ID!) {
  unhidePost(id: $id) {
    status
  }
}`,
      variables: { id: postId },
      field: 'unhidePost',
    });
    return { success: true, status, post_id: postId };
  },
});

export const movePostAction = createAction({
  auth: bettermodeAuth,
  name: 'move_post',
  classification: 'WRITE',
  displayName: 'Move Post',
  description: 'Move a post to another space.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves a post (with its replies) to another space. The target space must accept the post type. Not verified as retry-safe.',
    idempotent: false,
  },
  props: {
    post_id: bettermodeAiProps.id({ displayName: 'Post ID', description: 'The post to move.' }),
    space_id: bettermodeAiProps.id({ displayName: 'Target Space ID', description: 'The space to move it to.' }),
  },
  outputSchema: bettermodeSchemas.post,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `mutation MovePost($id: ID!, $spaceId: ID!) {
  movePost(id: $id, spaceId: $spaceId) {
${POST_FIELDS}
  }
}`,
      variables: {
        id: bettermodeInput.requireText({ value: propsValue.post_id, label: 'Post ID' }),
        spaceId: bettermodeInput.requireText({ value: propsValue.space_id, label: 'Target Space ID' }),
      },
    });
    return bettermodeMap.post(data['movePost']);
  },
});

export const listTagsAction = createAction({
  auth: bettermodeAuth,
  name: 'list_tags',
  classification: 'SEARCH',
  displayName: 'List Tags',
  description: 'List tags, optionally in one space or matching a name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists post tags one page at a time, optionally only those used in a space or matching a name. Use to reuse existing tag names when creating or updating posts. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    space_id: bettermodeAiProps.optionalId({ displayName: 'Space ID', description: 'Only tags of this space.' }),
    query: Property.ShortText({ displayName: 'Search', description: 'Filter tags by name.', required: false }),
    limit: bettermodeAiProps.limit(),
    cursor: bettermodeAiProps.cursor(),
  },
  outputSchema: bettermodeSchemas.tags,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `query ListTags($limit: Int!, $after: String, $spaceId: ID, $query: String) {
  tags(limit: $limit, after: $after, spaceId: $spaceId, query: $query) {
    nodes {
${TAG_FIELDS}
    }
    ${PAGE_INFO}
  }
}`,
      variables: {
        limit: bettermodeInput.limit({ value: propsValue.limit }),
        after: bettermodeInput.optionalText(propsValue.cursor) ?? null,
        spaceId: bettermodeInput.optionalText(propsValue.space_id),
        query: bettermodeInput.optionalText(propsValue.query),
      },
    });
    return bettermodeMap.page({ value: data['tags'], map: bettermodeMap.tag });
  },
});


async function fetchPost({ auth, postId }: { auth: BettermodeCredentials; postId: string }) {
  const data = await bettermodeQuery({
    auth,
    query: `query GetPost($id: ID!) {
  post(id: $id) {
${POST_FIELDS}
  }
}`,
    variables: { id: postId },
  });
  return data['post'];
}

async function defaultReplyTypeId({ auth, postId }: { auth: BettermodeCredentials; postId: string }): Promise<string> {
  const data = await bettermodeQuery({
    auth,
    query: `query GetReplyTypes($id: ID!) {
  post(id: $id) {
    id
    postType {
      validReplyTypes { id name }
    }
  }
}`,
    variables: { id: postId },
  });
  const replyTypes = bettermodeMap.records(readPath({ value: data, path: ['post', 'postType', 'validReplyTypes'] }));
  const first = replyTypes.map((type) => bettermodeMap.text(type['id'])).find((id): id is string => id !== null);
  if (first === undefined) {
    throw new Error('This post does not accept replies. Check the post type, or pass a Reply Post Type ID.');
  }
  return first;
}

const ORDER_BY_VALUES = ['createdAt', 'publishedAt', 'lastActivityAt', 'updatedAt', 'repliesCount', 'reactionsCount'];
