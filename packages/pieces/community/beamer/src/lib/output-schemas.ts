import { OutputSchema } from '@activepieces/pieces-framework';

const userCustomAttributesField: OutputSchema['fields'][number] = {
  key: 'userCustomAttributes',
  label: 'User Custom Attributes',
  dynamicKey: true,
};

const translationFields: OutputSchema['fields'] = [
  { key: 'title', label: 'Title' },
  { key: 'content', label: 'Content' },
  { key: 'contentHtml', label: 'Content HTML' },
  { key: 'category', label: 'Category' },
  { key: 'language', label: 'Language' },
  { key: 'postUrl', label: 'Post URL', format: 'url' },
];

const translationWithLinkFields: OutputSchema['fields'] = [
  ...translationFields,
  { key: 'linkUrl', label: 'Link URL', format: 'url' },
  { key: 'linkText', label: 'Link Text' },
];

const postBaseFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Post ID', format: 'number' },
  { key: 'date', label: 'Publication Date', format: 'datetime' },
  { key: 'category', label: 'Category' },
  { key: 'published', label: 'Published', format: 'boolean' },
  { key: 'autoOpen', label: 'Auto Open', format: 'boolean' },
  { key: 'feedbackEnabled', label: 'Feedback Enabled', format: 'boolean' },
  { key: 'reactionsEnabled', label: 'Reactions Enabled', format: 'boolean' },
  ];

const postFields: OutputSchema['fields'] = [
  ...postBaseFields,
  { key: 'translations', label: 'Translations', labelKey: 'title', listItems: translationWithLinkFields },
];

const postWithoutLinkFields: OutputSchema['fields'] = [
  ...postBaseFields,
  { key: 'translations', label: 'Translations', labelKey: 'title', listItems: translationFields },
];

const statsFields: OutputSchema['fields'] = [
  { key: 'views', label: 'Views', format: 'number' },
  { key: 'uniqueViews', label: 'Unique Views', format: 'number' },
  { key: 'clicks', label: 'Clicks', format: 'number' },
  { key: 'feedbacks', label: 'Feedback Count', format: 'number' },
  { key: 'positiveReactions', label: 'Positive Reactions', format: 'number' },
  { key: 'neutralReactions', label: 'Neutral Reactions', format: 'number' },
  { key: 'negativeReactions', label: 'Negative Reactions', format: 'number' },
];

const endUserFields: OutputSchema['fields'] = [
  { key: 'userId', label: 'User ID' },
  { key: 'userEmail', label: 'User Email', format: 'email' },
  { key: 'userFirstName', label: 'User First Name' },
  { key: 'userLastName', label: 'User Last Name' },
  userCustomAttributesField,
];

const postWithStatsFields: OutputSchema['fields'] = [...postFields, ...statsFields];

const listedPostFields: OutputSchema['fields'] = [...postWithoutLinkFields, ...statsFields];

export const beamerCountPostCommentsOutputSchema: OutputSchema = {
  fields: [{ key: 'count', label: 'Count', format: 'number' }],
};

export const beamerCountUnreadPostsOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Unread Count', format: 'number' },
    { key: 'url', label: 'Feed URL', format: 'url' },
  ],
};

export const beamerCreatePostOutputSchema: OutputSchema = { fields: postFields };

export const beamerDeletePostOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'postId', label: 'Post ID' },
  ],
};

export const beamerGetFeedUrlOutputSchema: OutputSchema = {
  fields: [{ key: 'url', label: 'Feed URL', format: 'url' }],
};

export const beamerGetPostOutputSchema: OutputSchema = { fields: postWithStatsFields };

export const beamerListPostCommentsOutputSchema: OutputSchema = {
  fields: [
    { key: 'comments', label: 'Comments' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const beamerListPostReactionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'reactions', label: 'Reactions' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const beamerListPostsOutputSchema: OutputSchema = {
  fields: [
    { key: 'posts', label: 'Posts', labelKey: 'id', listItems: listedPostFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const beamerListUnreadPostsOutputSchema: OutputSchema = {
  fields: [
    { key: 'posts', label: 'Posts', labelKey: 'id', listItems: postWithStatsFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const createBeamerPostOutputSchema: OutputSchema = { fields: postWithoutLinkFields };

export const createNewFeatureRequestOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Feature Request ID', format: 'number' },
    { key: 'date', label: 'Date', format: 'datetime' },
    { key: 'visible', label: 'Visible', format: 'boolean' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status' },
    {
      key: 'translations',
      label: 'Translations',
      labelKey: 'title',
      listItems: [
        { key: 'title', label: 'Title' },
        { key: 'content', label: 'Content' },
        { key: 'contentHtml', label: 'Content HTML' },
        { key: 'language', label: 'Language' },
        { key: 'permalink', label: 'Permalink', format: 'url' },
        { key: 'images', label: 'Images' },
      ],
    },
    { key: 'votesCount', label: 'Votes Count', format: 'number' },
    { key: 'commentsCount', label: 'Comments Count', format: 'number' },
    { key: 'notes', label: 'Notes' },
    { key: 'filters', label: 'Filters' },
    { key: 'internalUserEmail', label: 'Team Member Email', format: 'email' },
    { key: 'internalUserFirstname', label: 'Team Member First Name' },
    { key: 'internalUserLastname', label: 'Team Member Last Name' },
    { key: 'userId', label: 'User ID' },
    { key: 'userEmail', label: 'User Email', format: 'email' },
    { key: 'userFirstname', label: 'User First Name' },
    { key: 'userLastname', label: 'User Last Name' },
    userCustomAttributesField,
  ],
};

export const createNewCommentOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Comment ID', format: 'number' },
    { key: 'date', label: 'Date', format: 'datetime' },
    { key: 'visible', label: 'Visible', format: 'boolean' },
    { key: 'actionComment', label: 'Action Comment', format: 'boolean' },
    { key: 'text', label: 'Text' },
    { key: 'featureRequestTitle', label: 'Feature Request Title' },
    { key: 'parentComment', label: 'Parent Comment' },
    { key: 'internalUserEmail', label: 'Team Member Email', format: 'email' },
    { key: 'internalUserFirstname', label: 'Team Member First Name' },
    { key: 'internalUserLastname', label: 'Team Member Last Name' },
    ...endUserFields,
    { key: 'url', label: 'Dashboard URL', format: 'url' },
  ],
};

export const createVoteOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Vote ID', format: 'number' },
    { key: 'date', label: 'Date', format: 'datetime' },
    { key: 'featureRequestTitle', label: 'Feature Request Title' },
    ...endUserFields,
    { key: 'url', label: 'Dashboard URL', format: 'url' },
  ],
};
