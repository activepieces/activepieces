import { OutputSchema } from '@activepieces/pieces-framework';

const pagingFields: OutputSchema['fields'] = [
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'after', label: 'Next Page Cursor' },
  { key: 'before', label: 'Previous Page Cursor' },
];

const postFields: OutputSchema['fields'] = [
  { key: 'kind', label: 'Kind' },
  { key: 'id', label: 'Post ID' },
  { key: 'name', label: 'Fullname' },
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'subreddit', label: 'Subreddit' },
  { key: 'subreddit_name_prefixed', label: 'Subreddit (Prefixed)' },
  { key: 'selftext', label: 'Body Text' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'permalink', label: 'Permalink' },
  { key: 'domain', label: 'Domain' },
  { key: 'score', label: 'Score', format: 'number' },
  { key: 'upvote_ratio', label: 'Upvote Ratio', format: 'number' },
  { key: 'num_comments', label: 'Comment Count', format: 'number' },
  { key: 'num_crossposts', label: 'Crosspost Count', format: 'number' },
  { key: 'created_utc', label: 'Created At (Unix Seconds)', format: 'number' },
  { key: 'edited', label: 'Edited' },
  { key: 'is_self', label: 'Is Text Post', format: 'boolean' },
  { key: 'over_18', label: 'NSFW', format: 'boolean' },
  { key: 'spoiler', label: 'Spoiler', format: 'boolean' },
  { key: 'stickied', label: 'Stickied', format: 'boolean' },
  { key: 'locked', label: 'Locked', format: 'boolean' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'link_flair_text', label: 'Flair Text' },
  { key: 'link_flair_template_id', label: 'Flair Template ID' },
  { key: 'crosspost_parent', label: 'Crosspost Parent' },
];

const commentOnlyFields: OutputSchema['fields'] = [
  { key: 'body', label: 'Body' },
  { key: 'parent_id', label: 'Parent Fullname' },
  { key: 'link_id', label: 'Post Fullname' },
  { key: 'link_title', label: 'Post Title' },
  { key: 'depth', label: 'Depth', format: 'number' },
  { key: 'is_submitter', label: 'Is Post Author', format: 'boolean' },
  { key: 'distinguished', label: 'Distinguished' },
];

const commentFields: OutputSchema['fields'] = [
  { key: 'kind', label: 'Kind' },
  { key: 'id', label: 'Comment ID' },
  { key: 'name', label: 'Fullname' },
  { key: 'author', label: 'Author' },
  { key: 'score', label: 'Score', format: 'number' },
  { key: 'created_utc', label: 'Created At (Unix Seconds)', format: 'number' },
  { key: 'edited', label: 'Edited' },
  { key: 'permalink', label: 'Permalink' },
  { key: 'subreddit', label: 'Subreddit' },
  { key: 'stickied', label: 'Stickied', format: 'boolean' },
  ...commentOnlyFields,
];

const postOrCommentFields: OutputSchema['fields'] = [...postFields, ...commentOnlyFields];

const subredditFields: OutputSchema['fields'] = [
  { key: 'kind', label: 'Kind' },
  { key: 'id', label: 'Subreddit ID' },
  { key: 'name', label: 'Fullname' },
  { key: 'display_name', label: 'Name' },
  { key: 'display_name_prefixed', label: 'Name (Prefixed)' },
  { key: 'title', label: 'Title' },
  { key: 'public_description', label: 'Public Description' },
  { key: 'subscribers', label: 'Subscribers', format: 'number' },
  { key: 'active_user_count', label: 'Active Users', format: 'number' },
  { key: 'subreddit_type', label: 'Type' },
  { key: 'submission_type', label: 'Allowed Submissions' },
  { key: 'over18', label: 'NSFW', format: 'boolean' },
  { key: 'lang', label: 'Language' },
  { key: 'created_utc', label: 'Created At (Unix Seconds)', format: 'number' },
  { key: 'url', label: 'Path' },
  { key: 'user_is_subscriber', label: 'Subscribed', format: 'boolean' },
  { key: 'user_is_moderator', label: 'Moderator', format: 'boolean' },
];

const userFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'name', label: 'Username' },
  { key: 'link_karma', label: 'Post Karma', format: 'number' },
  { key: 'comment_karma', label: 'Comment Karma', format: 'number' },
  { key: 'total_karma', label: 'Total Karma', format: 'number' },
  { key: 'created_utc', label: 'Created At (Unix Seconds)', format: 'number' },
  { key: 'is_gold', label: 'Premium', format: 'boolean' },
  { key: 'is_mod', label: 'Is Moderator', format: 'boolean' },
  { key: 'verified', label: 'Verified', format: 'boolean' },
  { key: 'has_verified_email', label: 'Verified Email', format: 'boolean' },
  { key: 'is_employee', label: 'Reddit Employee', format: 'boolean' },
  { key: 'icon_img', label: 'Avatar', format: 'image' },
];

const flairFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Flair Template ID' },
  { key: 'text', label: 'Text' },
  { key: 'text_editable', label: 'Text Editable', format: 'boolean' },
  { key: 'type', label: 'Type' },
  { key: 'mod_only', label: 'Mod Only', format: 'boolean' },
  { key: 'allowable_content', label: 'Allowed Content' },
  { key: 'max_emojis', label: 'Max Emojis', format: 'number' },
  { key: 'background_color', label: 'Background Color' },
  { key: 'text_color', label: 'Text Color' },
];

const rawPostFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Post ID' },
  { key: 'name', label: 'Fullname' },
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'subreddit', label: 'Subreddit' },
  { key: 'selftext', label: 'Body Text' },
  { key: 'selftext_html', label: 'Body HTML', format: 'html' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'permalink', label: 'Permalink' },
  { key: 'domain', label: 'Domain' },
  { key: 'score', label: 'Score', format: 'number' },
  { key: 'upvote_ratio', label: 'Upvote Ratio', format: 'number' },
  { key: 'num_comments', label: 'Comment Count', format: 'number' },
  { key: 'created_utc', label: 'Created At (Unix Seconds)', format: 'number' },
  { key: 'is_self', label: 'Is Text Post', format: 'boolean' },
  { key: 'is_video', label: 'Is Video', format: 'boolean' },
  { key: 'over_18', label: 'NSFW', format: 'boolean' },
  { key: 'spoiler', label: 'Spoiler', format: 'boolean' },
  { key: 'locked', label: 'Locked', format: 'boolean' },
  { key: 'stickied', label: 'Stickied', format: 'boolean' },
  { key: 'link_flair_text', label: 'Flair Text' },
];

const rawCommentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Comment ID' },
  { key: 'name', label: 'Fullname' },
  { key: 'author', label: 'Author' },
  { key: 'body', label: 'Body' },
  { key: 'body_html', label: 'Body HTML', format: 'html' },
  { key: 'parent_id', label: 'Parent Fullname' },
  { key: 'link_id', label: 'Post Fullname' },
  { key: 'subreddit', label: 'Subreddit' },
  { key: 'permalink', label: 'Permalink' },
  { key: 'score', label: 'Score', format: 'number' },
  { key: 'created_utc', label: 'Created At (Unix Seconds)', format: 'number' },
];

export const redditDeleteMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'id', label: 'Fullname' },
  ],
};

export const redditListMessagesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'messages',
      label: 'Messages',
      labelKey: 'subject',
      listItems: [
        { key: 'kind', label: 'Kind' },
        { key: 'id', label: 'Message ID' },
        { key: 'name', label: 'Fullname' },
        { key: 'author', label: 'From' },
        { key: 'dest', label: 'To' },
        { key: 'subject', label: 'Subject' },
        { key: 'body', label: 'Body' },
        { key: 'created_utc', label: 'Created At (Unix Seconds)', format: 'number' },
        { key: 'new', label: 'Unread', format: 'boolean' },
        { key: 'was_comment', label: 'Is Comment Reply', format: 'boolean' },
        { key: 'parent_id', label: 'Parent Fullname' },
        { key: 'first_message_name', label: 'Thread Fullname' },
        { key: 'context', label: 'Context Path' },
        { key: 'subreddit', label: 'Subreddit' },
        { key: 'distinguished', label: 'Distinguished' },
      ],
    },
    ...pagingFields,
  ],
};

export const redditListPostFlairsOutputSchema: OutputSchema = {
  fields: [
    { key: 'flairs', label: 'Flairs', labelKey: 'text', listItems: flairFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const redditSendMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'to', label: 'To' },
    { key: 'subject', label: 'Subject' },
  ],
};

export const redditCreateCommentOutputSchema: OutputSchema = {
  fields: commentFields,
};

export const redditCreatePostOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Post ID' },
    { key: 'name', label: 'Fullname' },
    { key: 'url', label: 'URL', format: 'url' },
  ],
};

export const redditListDuplicatesOutputSchema: OutputSchema = {
  fields: [
    { key: 'post', label: 'Original Post', children: postFields },
    { key: 'duplicates', label: 'Duplicates', labelKey: 'title', listItems: postFields },
    ...pagingFields,
  ],
};

export const redditEditTextOutputSchema: OutputSchema = {
  fields: postOrCommentFields,
};

export const redditExpandMoreCommentsOutputSchema: OutputSchema = {
  fields: [
    { key: 'comments', label: 'Comments', labelKey: 'author', listItems: commentFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'more', label: 'More Placeholders' },
  ],
};

export const redditGetContentOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'name',
      listItems: [
        ...postOrCommentFields,
        { key: 'display_name', label: 'Subreddit Name' },
        { key: 'public_description', label: 'Subreddit Description' },
        { key: 'subscribers', label: 'Subscribers', format: 'number' },
        { key: 'subreddit_type', label: 'Subreddit Type' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const redditGetSubredditOutputSchema: OutputSchema = {
  fields: subredditFields,
};

export const redditGetUserOutputSchema: OutputSchema = {
  fields: [{ key: 'kind', label: 'Kind' }, ...userFields],
};

export const redditHidePostOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'ids', label: 'Fullnames' },
    { key: 'hidden', label: 'Hidden', format: 'boolean' },
  ],
};

export const redditSetInboxRepliesOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'id', label: 'Fullname' },
    { key: 'inbox_replies', label: 'Inbox Replies Enabled', format: 'boolean' },
  ],
};

export const redditGetMyKarmaOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'karma',
      label: 'Karma by Subreddit',
      labelKey: 'subreddit',
      listItems: [
        { key: 'subreddit', label: 'Subreddit' },
        { key: 'link_karma', label: 'Post Karma', format: 'number' },
        { key: 'comment_karma', label: 'Comment Karma', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const redditListPostsOutputSchema: OutputSchema = {
  fields: [{ key: 'posts', label: 'Posts', labelKey: 'title', listItems: postFields }, ...pagingFields],
};

export const redditListSubredditsOutputSchema: OutputSchema = {
  fields: [
    { key: 'subreddits', label: 'Subreddits', labelKey: 'display_name', listItems: subredditFields },
    ...pagingFields,
  ],
};

export const redditMarkAllMessagesReadOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const redditMarkMessageReadOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'ids', label: 'Fullnames' },
    { key: 'read', label: 'Read', format: 'boolean' },
  ],
};

export const redditGetMeOutputSchema: OutputSchema = {
  fields: [
    ...userFields,
    { key: 'inbox_count', label: 'Unread Inbox Count', format: 'number' },
    { key: 'has_mail', label: 'Has Unread Mail', format: 'boolean' },
    { key: 'over_18', label: 'NSFW Enabled', format: 'boolean' },
  ],
};

export const redditListSubredditModeratorsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'moderators',
      label: 'Moderators',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Username' },
        { key: 'id', label: 'User Fullname' },
        { key: 'mod_permissions', label: 'Permissions' },
        { key: 'date', label: 'Added At (Unix Seconds)', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const redditListMySubredditsOutputSchema: OutputSchema = redditListSubredditsOutputSchema;

export const redditListPostCommentsOutputSchema: OutputSchema = {
  fields: [
    { key: 'post', label: 'Post', children: postFields },
    { key: 'comments', label: 'Comments', labelKey: 'author', listItems: commentFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'more', label: 'More Placeholders' },
  ],
};

export const redditGetPostRequirementsOutputSchema: OutputSchema = {
  fields: [
    { key: 'is_flair_required', label: 'Flair Required', format: 'boolean' },
    { key: 'title_text_min_length', label: 'Title Min Length', format: 'number' },
    { key: 'title_text_max_length', label: 'Title Max Length', format: 'number' },
    { key: 'title_required_strings', label: 'Title Required Strings' },
    { key: 'title_blacklisted_strings', label: 'Title Banned Strings' },
    { key: 'title_regexes', label: 'Title Regexes' },
    { key: 'body_restriction_policy', label: 'Body Policy' },
    { key: 'body_text_min_length', label: 'Body Min Length', format: 'number' },
    { key: 'body_text_max_length', label: 'Body Max Length', format: 'number' },
    { key: 'body_required_strings', label: 'Body Required Strings' },
    { key: 'body_blacklisted_strings', label: 'Body Banned Strings' },
    { key: 'body_regexes', label: 'Body Regexes' },
    { key: 'link_restriction_policy', label: 'Link Policy' },
    { key: 'domain_whitelist', label: 'Allowed Domains' },
    { key: 'domain_blacklist', label: 'Banned Domains' },
    { key: 'link_repost_age', label: 'Repost Age (Days)', format: 'number' },
    { key: 'gallery_min_items', label: 'Gallery Min Items', format: 'number' },
    { key: 'gallery_max_items', label: 'Gallery Max Items', format: 'number' },
    { key: 'gallery_captions_requirement', label: 'Gallery Captions' },
    { key: 'gallery_urls_requirement', label: 'Gallery URLs' },
    { key: 'guidelines_text', label: 'Guidelines' },
    { key: 'guidelines_display_policy', label: 'Guidelines Display Policy' },
  ],
};

export const redditGetMyPreferencesOutputSchema: OutputSchema = {
  fields: [
    { key: 'accept_pms', label: 'Accept Messages From' },
    { key: 'country_code', label: 'Country Code' },
    { key: 'lang', label: 'Language' },
    { key: 'over_18', label: 'NSFW Enabled', format: 'boolean' },
    { key: 'search_include_over_18', label: 'NSFW in Search', format: 'boolean' },
    { key: 'label_nsfw', label: 'Label NSFW', format: 'boolean' },
    { key: 'default_comment_sort', label: 'Default Comment Sort' },
    { key: 'min_comment_score', label: 'Min Comment Score', format: 'number' },
    { key: 'min_link_score', label: 'Min Post Score', format: 'number' },
    { key: 'num_comments', label: 'Comments per Page', format: 'number' },
    { key: 'media', label: 'Media Display' },
    { key: 'media_preview', label: 'Media Preview' },
    { key: 'video_autoplay', label: 'Video Autoplay', format: 'boolean' },
    { key: 'nightmode', label: 'Night Mode', format: 'boolean' },
    { key: 'enable_followers', label: 'Followers Enabled', format: 'boolean' },
    { key: 'show_presence', label: 'Show Online Status', format: 'boolean' },
    { key: 'hide_from_robots', label: 'Hidden From Search Engines', format: 'boolean' },
    { key: 'public_votes', label: 'Public Votes', format: 'boolean' },
    { key: 'profile_opt_out', label: 'Profile Opt Out', format: 'boolean' },
    { key: 'threaded_messages', label: 'Threaded Messages', format: 'boolean' },
    { key: 'email_messages', label: 'Email on Messages', format: 'boolean' },
    { key: 'email_private_message', label: 'Email on Private Message', format: 'boolean' },
    { key: 'email_digests', label: 'Email Digests', format: 'boolean' },
  ],
};

export const redditReportContentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'id', label: 'Fullname' },
    { key: 'reason', label: 'Reason' },
  ],
};

export const redditGetSubredditRulesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rules',
      label: 'Rules',
      labelKey: 'short_name',
      listItems: [
        { key: 'short_name', label: 'Rule' },
        { key: 'description', label: 'Description' },
        { key: 'kind', label: 'Applies To' },
        { key: 'priority', label: 'Priority', format: 'number' },
        { key: 'violation_reason', label: 'Report Reason' },
        { key: 'created_utc', label: 'Created At (Unix Seconds)', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'site_rules', label: 'Site-wide Rules' },
  ],
};

export const redditSaveContentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'id', label: 'Fullname' },
    { key: 'saved', label: 'Saved', format: 'boolean' },
  ],
};

export const redditListSavedCategoriesOutputSchema: OutputSchema = {
  fields: [
    { key: 'categories', label: 'Categories' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const redditSearchUsersOutputSchema: OutputSchema = {
  fields: [
    { key: 'users', label: 'Users', labelKey: 'name', listItems: [{ key: 'kind', label: 'Kind' }, ...userFields] },
    ...pagingFields,
  ],
};

export const redditSetPostFlairOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'post', label: 'Post Fullname' },
    { key: 'flair_template_id', label: 'Flair Template ID' },
    { key: 'text', label: 'Flair Text' },
  ],
};

export const redditListSubredditCommentsOutputSchema: OutputSchema = {
  fields: [{ key: 'comments', label: 'Comments', labelKey: 'author', listItems: commentFields }, ...pagingFields],
};

export const redditGetSubmitTextOutputSchema: OutputSchema = {
  fields: [
    { key: 'subreddit', label: 'Subreddit' },
    { key: 'submit_text', label: 'Submission Guidelines' },
    { key: 'submit_text_html', label: 'Submission Guidelines HTML', format: 'html' },
  ],
};

export const redditSubscribeSubredditOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'subreddit', label: 'Subreddit' },
    { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
  ],
};

export const redditGetUserTrophiesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'trophies',
      label: 'Trophies',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Trophy ID' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'award_id', label: 'Award ID' },
        { key: 'granted_at', label: 'Granted At (Unix Seconds)', format: 'number' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'icon_70', label: 'Icon', format: 'image' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const redditListUserFlairsOutputSchema: OutputSchema = {
  fields: [
    { key: 'flairs', label: 'Flairs' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const redditListUserContentOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: postOrCommentFields },
    ...pagingFields,
  ],
};

export const redditGetWikiPageOutputSchema: OutputSchema = {
  fields: [
    { key: 'subreddit', label: 'Subreddit' },
    { key: 'page', label: 'Page' },
    { key: 'content_md', label: 'Content (Markdown)' },
    { key: 'revision_id', label: 'Revision ID' },
    { key: 'revision_date', label: 'Revised At (Unix Seconds)', format: 'number' },
    { key: 'revision_by', label: 'Revised By' },
    { key: 'may_revise', label: 'Can Edit', format: 'boolean' },
  ],
};

export const redditListWikiPagesOutputSchema: OutputSchema = {
  fields: [
    { key: 'pages', label: 'Page Names' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const createRedditCommentOutputSchema: OutputSchema = rawThingsResponse({ dataFields: rawCommentFields });

export const editRedditPostOutputSchema: OutputSchema = rawThingsResponse({ dataFields: rawPostFields });

export const createRedditPostOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'json',
      label: 'Response',
      children: [
        { key: 'errors', label: 'Errors' },
        {
          key: 'data',
          label: 'Data',
          children: [
            { key: 'id', label: 'Post ID' },
            { key: 'name', label: 'Fullname' },
            { key: 'url', label: 'URL', format: 'url' },
          ],
        },
      ],
    },
  ],
};

export const deleteRedditContentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'response', label: 'Response' },
  ],
};

export const fetchPostCommentsOutputSchema: OutputSchema = {
  itemLabel: '{author}',
  fields: [
    {
      key: 'comments',
      label: 'Comments',
      value: '',
      listItems: [
        { key: 'id', label: 'Comment ID' },
        { key: 'author', label: 'Author' },
        { key: 'body', label: 'Body' },
        { key: 'score', label: 'Score', format: 'number' },
        { key: 'created_utc', label: 'Created At (Unix Seconds)', format: 'number' },
        { key: 'permalink', label: 'Permalink' },
        { key: 'edited', label: 'Edited' },
        { key: 'is_submitter', label: 'Is Post Author', format: 'boolean' },
        { key: 'stickied', label: 'Stickied', format: 'boolean' },
        { key: 'replies', label: 'Replies' },
      ],
    },
  ],
};

export const getRedditPostDetailsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Post ID' },
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    { key: 'author_fullname', label: 'Author Fullname' },
    { key: 'subreddit', label: 'Subreddit' },
    { key: 'subreddit_id', label: 'Subreddit Fullname' },
    { key: 'selftext', label: 'Body Text' },
    { key: 'selftext_html', label: 'Body HTML', format: 'html' },
    { key: 'score', label: 'Score', format: 'number' },
    { key: 'upvote_ratio', label: 'Upvote Ratio', format: 'number' },
    { key: 'created_utc', label: 'Created At (Unix Seconds)', format: 'number' },
    { key: 'permalink', label: 'Permalink' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'domain', label: 'Domain' },
    { key: 'num_comments', label: 'Comment Count', format: 'number' },
    { key: 'is_self', label: 'Is Text Post', format: 'boolean' },
    { key: 'is_video', label: 'Is Video', format: 'boolean' },
    { key: 'is_original_content', label: 'Original Content', format: 'boolean' },
    { key: 'over_18', label: 'NSFW', format: 'boolean' },
    { key: 'spoiler', label: 'Spoiler', format: 'boolean' },
    { key: 'locked', label: 'Locked', format: 'boolean' },
    { key: 'stickied', label: 'Stickied', format: 'boolean' },
  ],
};

export const retrieveRedditPostOutputSchema: OutputSchema = {
  fields: [
    { key: 'kind', label: 'Kind' },
    {
      key: 'data',
      label: 'Listing',
      children: [
        { key: 'after', label: 'Next Page Cursor' },
        { key: 'before', label: 'Previous Page Cursor' },
        { key: 'dist', label: 'Count', format: 'number' },
        {
          key: 'children',
          label: 'Posts',
          listItems: [
            { key: 'kind', label: 'Kind' },
            { key: 'data', label: 'Post', children: rawPostFields },
          ],
        },
      ],
    },
  ],
};

function rawThingsResponse({ dataFields }: { dataFields: OutputSchema['fields'] }): OutputSchema {
  return {
    fields: [
      {
        key: 'json',
        label: 'Response',
        children: [
          { key: 'errors', label: 'Errors' },
          {
            key: 'data',
            label: 'Data',
            children: [
              {
                key: 'things',
                label: 'Things',
                listItems: [
                  { key: 'kind', label: 'Kind' },
                  { key: 'data', label: 'Data', children: dataFields },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}
