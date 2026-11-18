const CHANNEL_FIELDS = `
  id
  name
  displayName
  service
  type
  avatar
  descriptor
  externalLink
  isDisconnected
  isLocked
  isQueuePaused
  timezone
  organizationId
  createdAt
  updatedAt
`;

const CHANNEL_DETAIL_FIELDS = `
  ${CHANNEL_FIELDS}
  serviceId
  allowedActions
  postingSchedule { day times paused }
  postingGoal { goal sentCount scheduledCount periodStart periodEnd status }
  linkShortening { isEnabled }
  metadata {
    __typename
    ... on PinterestMetadata { boards { serviceId name url description } }
    ... on MastodonMetadata { serverUrl maxCharacters }
    ... on BlueskyMetadata { serverUrl }
    ... on InstagramMetadata { defaultToReminders }
    ... on YoutubeMetadata { defaultToReminders }
    ... on TiktokMetadata { defaultToReminders }
  }
`;

const LINK_ATTACHMENT_FIELDS = 'url title text thumbnail';

const POST_FIELDS = `
  id
  text
  status
  dueAt
  sentAt
  createdAt
  updatedAt
  channelId
  channelService
  isCustomScheduled
  shareMode
  schedulingType
  sharedNow
  via
  externalLink
  ideaId
  allowedActions
  channel { id name displayName service }
  tags { id name color }
  error { message rawError supportUrl }
  assets { id type mimeType source thumbnail }
  author { id name }
  metadata {
    __typename
    ... on FacebookPostMetadata { linkAttachment { ${LINK_ATTACHMENT_FIELDS} } }
    ... on LinkedInPostMetadata { linkAttachment { ${LINK_ATTACHMENT_FIELDS} } }
    ... on ThreadsPostMetadata { linkAttachment { ${LINK_ATTACHMENT_FIELDS} } }
    ... on BlueskyPostMetadata { linkAttachment { ${LINK_ATTACHMENT_FIELDS} } }
    ... on SubstackPostMetadata { linkAttachment { ${LINK_ATTACHMENT_FIELDS} } }
    ... on YoutubePostMetadata { title privacy category { categoryId title } }
  }
`;

const POST_EDIT_SOURCE_FIELDS = `
  id
  text
  channelService
  assets {
    type
    source
    thumbnail
    ... on ImageAsset { image { altText } }
    ... on VideoAsset { video { title thumbnailOffset } }
    ... on DocumentAsset { document { title } }
  }
  metadata {
    __typename
    ... on YoutubePostMetadata {
      title
      privacy
      license
      madeForKids
      notifySubscribers
      embeddable
      isAiGenerated
      category { categoryId }
    }
  }
`;

const POST_METRICS_FIELDS = `
  metrics @include(if: $withMetrics) { type name description unit value }
  metricsUpdatedAt @include(if: $withMetrics)
`;

const TRIGGER_POST_FIELDS = `
  id
  text
  status
  createdAt
  updatedAt
  dueAt
  sentAt
  channelId
  channelService
  channel { id name service }
  tags { id name }
`;

const IDEA_FIELDS = `
  id
  organizationId
  groupId
  position
  createdAt
  updatedAt
  content {
    title
    text
    aiAssisted
    date
    services
    media { id url type alt thumbnailUrl }
    tags { id name color }
  }
`;

const CREATED_IDEA_FIELDS = `
  id
  organizationId
  groupId
  createdAt
  updatedAt
  content {
    title
    text
    media { url type alt }
    tags { id name color }
  }
`;

const PAGE_INFO = `pageInfo { endCursor hasNextPage }`;

const MUTATION_ERROR = `... on MutationError { message }`;

export const bufferQueries = {
  ACCOUNT: `query Account {
    account {
      id
      email
      name
      timezone
      organizations {
        id
        name
        channelCount
        ownerEmail
        members { totalCount }
        limits { channels scheduledPosts ideas ideaGroups tags members }
      }
    }
  }`,
  ACCOUNT_ID: `query AccountId { account { id } }`,
  ORGANIZATIONS: `query Organizations { account { organizations { id name } } }`,
  CHANNELS: `query Channels($organizationId: OrganizationId!) {
    channels(input: { organizationId: $organizationId }) {
      ${CHANNEL_FIELDS}
    }
  }`,
  CHANNEL: `query Channel($id: ChannelId!) {
    channel(input: { id: $id }) {
      ${CHANNEL_DETAIL_FIELDS}
    }
  }`,
  CHANNEL_SERVICE: `query ChannelService($id: ChannelId!) {
    channel(input: { id: $id }) { id service organizationId }
  }`,
  POSTS: `query Posts($input: PostsInput!, $first: Int, $after: String, $withMetrics: Boolean!) {
    posts(input: $input, first: $first, after: $after) {
      edges { node { ${POST_FIELDS} ${POST_METRICS_FIELDS} } }
      ${PAGE_INFO}
    }
  }`,
  TRIGGER_POSTS: `query TriggerPosts($input: PostsInput!, $first: Int, $after: String) {
    posts(input: $input, first: $first, after: $after) {
      edges { node { ${TRIGGER_POST_FIELDS} } }
      ${PAGE_INFO}
    }
  }`,
  POST: `query Post($id: PostId!, $withMetrics: Boolean!) {
    post(input: { id: $id }) { ${POST_FIELDS} ${POST_METRICS_FIELDS} }
  }`,
  POST_EDIT_SOURCE: `query PostEditSource($id: PostId!) {
    post(input: { id: $id }) { ${POST_EDIT_SOURCE_FIELDS} }
  }`,
  CREATE_POST: `mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      __typename
      ... on PostActionSuccess { post { ${POST_FIELDS} } }
      ${MUTATION_ERROR}
    }
  }`,
  CREATE_POST_LEGACY: `mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      __typename
      ... on PostActionSuccess { post { id text status dueAt sentAt channelId } }
      ${MUTATION_ERROR}
    }
  }`,
  EDIT_POST: `mutation EditPost($input: EditPostInput!) {
    editPost(input: $input) {
      __typename
      ... on PostActionSuccess { post { ${POST_FIELDS} } }
      ${MUTATION_ERROR}
    }
  }`,
  DELETE_POST: `mutation DeletePost($id: PostId!) {
    deletePost(input: { id: $id }) {
      __typename
      ... on DeletePostSuccess { id }
      ${MUTATION_ERROR}
    }
  }`,
  IDEAS: `query Ideas($input: IdeasInput!, $first: Int, $after: String) {
    ideas(input: $input, first: $first, after: $after) {
      edges { node { ${IDEA_FIELDS} } }
      ${PAGE_INFO}
    }
  }`,
  IDEA_GROUPS: `query IdeaGroups($organizationId: ID!) {
    ideaGroups(input: { organizationId: $organizationId }) { id name isLocked }
  }`,
  CREATE_IDEA: `mutation CreateIdea($input: CreateIdeaInput!) {
    createIdea(input: $input) {
      __typename
      ... on Idea { ${CREATED_IDEA_FIELDS} }
      ... on IdeaResponse {
        idea { ${CREATED_IDEA_FIELDS} }
        refreshIdeas
      }
      ${MUTATION_ERROR}
    }
  }`,
  AGGREGATED_METRICS: `query AggregatedPostMetrics($input: AggregatedPostMetricsInput!) {
    aggregatedPostMetrics(input: $input) {
      metricsUpdatedAt
      metrics { type name description unit value }
    }
  }`,
  TAGS: `query Tags($input: TagsInput!, $first: Int, $after: String) {
    tagsV2(input: $input, first: $first, after: $after) {
      totalCount
      edges { node { id name color colorName isLocked } }
      ${PAGE_INFO}
    }
  }`,
};
