import { OutputSchema } from '@activepieces/pieces-framework';

type Fields = OutputSchema['fields'];

const paginationFields: Fields = [
  { key: 'page', label: 'Page', format: 'number' },
  { key: 'limit', label: 'Limit' },
  { key: 'total_pages', label: 'Total Pages', format: 'number' },
  { key: 'total', label: 'Total', format: 'number' },
  { key: 'next', label: 'Next Page', format: 'number' },
  { key: 'prev', label: 'Previous Page', format: 'number' },
];

const tagFields: Fields = [
  { key: 'id', label: 'Tag ID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'description', label: 'Description' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'accent_color', label: 'Accent Color' },
  { key: 'feature_image', label: 'Feature Image', format: 'image' },
  { key: 'meta_title', label: 'Meta Title' },
  { key: 'meta_description', label: 'Meta Description' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const tagWithCountFields: Fields = [
  ...tagFields,
  {
    key: 'count',
    label: 'Count',
    children: [{ key: 'posts', label: 'Posts', format: 'number' }],
  },
];

const authorFields: Fields = [
  { key: 'id', label: 'User ID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'status', label: 'Status' },
  { key: 'profile_image', label: 'Profile Image', format: 'image' },
  { key: 'bio', label: 'Bio' },
  { key: 'website', label: 'Website', format: 'url' },
  { key: 'location', label: 'Location' },
  { key: 'url', label: 'Author Page URL', format: 'url' },
];

const userBaseFields: Fields = [
  ...authorFields,
  { key: 'cover_image', label: 'Cover Image', format: 'image' },
  { key: 'last_seen', label: 'Last Seen', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const userFields: Fields = [
  ...userBaseFields,
  {
    key: 'roles',
    label: 'Roles',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Role ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
    ],
  },
  {
    key: 'count',
    label: 'Count',
    children: [{ key: 'posts', label: 'Posts', format: 'number' }],
  },
];

const contentBaseFields: Fields = [
  { key: 'id', label: 'ID' },
  { key: 'uuid', label: 'UUID' },
  { key: 'title', label: 'Title' },
  { key: 'slug', label: 'Slug' },
  { key: 'status', label: 'Status' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'html', label: 'HTML', format: 'html' },
  { key: 'excerpt', label: 'Excerpt' },
  { key: 'custom_excerpt', label: 'Custom Excerpt' },
  { key: 'featured', label: 'Featured', format: 'boolean' },
  { key: 'feature_image', label: 'Feature Image', format: 'image' },
  { key: 'feature_image_alt', label: 'Feature Image Alt Text' },
  { key: 'feature_image_caption', label: 'Feature Image Caption' },
  { key: 'reading_time', label: 'Reading Time (minutes)', format: 'number' },
  { key: 'meta_title', label: 'Meta Title' },
  { key: 'meta_description', label: 'Meta Description' },
  { key: 'canonical_url', label: 'Canonical URL', format: 'url' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'published_at', label: 'Published At', format: 'datetime' },
  { key: 'tags', label: 'Tags', labelKey: 'name', listItems: tagFields },
  { key: 'authors', label: 'Authors', labelKey: 'name', listItems: authorFields },
  { key: 'primary_tag', label: 'Primary Tag', children: tagFields },
  { key: 'primary_author', label: 'Primary Author', children: authorFields },
];

const postFields: Fields = [
  ...contentBaseFields,
  { key: 'email_only', label: 'Email Only', format: 'boolean' },
  { key: 'email_segment', label: 'Email Segment' },
  { key: 'email_subject', label: 'Email Subject' },
];

const pageFields: Fields = [
  ...contentBaseFields,
  {
    key: 'show_title_and_feature_image',
    label: 'Show Title and Feature Image',
    format: 'boolean',
  },
];

const labelFields: Fields = [
  { key: 'id', label: 'Label ID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const labelWithCountFields: Fields = [
  ...labelFields,
  {
    key: 'count',
    label: 'Count',
    children: [{ key: 'members', label: 'Members', format: 'number' }],
  },
];

const memberNewsletterFields: Fields = [
  { key: 'id', label: 'Newsletter ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
];

const memberCoreFields: Fields = [
  { key: 'id', label: 'Member ID' },
  { key: 'uuid', label: 'UUID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'name', label: 'Name' },
  { key: 'note', label: 'Note' },
  { key: 'status', label: 'Status' },
  { key: 'geolocation', label: 'Geolocation' },
  { key: 'email_count', label: 'Emails Received', format: 'number' },
  { key: 'email_opened_count', label: 'Emails Opened', format: 'number' },
  { key: 'email_open_rate', label: 'Email Open Rate', format: 'number' },
  { key: 'last_seen_at', label: 'Last Seen At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'labels', label: 'Labels', labelKey: 'name', listItems: labelFields },
  {
    key: 'newsletters',
    label: 'Newsletters',
    labelKey: 'name',
    listItems: memberNewsletterFields,
  },
];

const memberListFields: Fields = [
  ...memberCoreFields,
  { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
  { key: 'comped', label: 'Comped', format: 'boolean' },
  { key: 'avatar_image', label: 'Avatar Image', format: 'image' },
];

const memberFields: Fields = [...memberListFields, { key: 'tiers', label: 'Tiers' }];

const memberWithAttributionFields: Fields = [
  ...memberFields,
  { key: 'unsubscribe_url', label: 'Unsubscribe URL', format: 'url' },
  {
    key: 'attribution',
    label: 'Attribution',
    children: [
      { key: 'referrer_source', label: 'Referrer Source' },
      { key: 'referrer_medium', label: 'Referrer Medium' },
      { key: 'referrer_url', label: 'Referrer URL', format: 'url' },
      { key: 'url', label: 'Signup Page URL', format: 'url' },
      { key: 'title', label: 'Signup Page Title' },
    ],
  },
];

const newsletterFields: Fields = [
  { key: 'id', label: 'Newsletter ID' },
  { key: 'uuid', label: 'UUID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'subscribe_on_signup', label: 'Subscribe on Signup', format: 'boolean' },
  { key: 'sender_name', label: 'Sender Name' },
  { key: 'sender_email', label: 'Sender Email', format: 'email' },
  { key: 'sender_reply_to', label: 'Reply To' },
  { key: 'sort_order', label: 'Sort Order', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const tierFields: Fields = [
  { key: 'id', label: 'Tier ID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'welcome_page_url', label: 'Welcome Page URL', format: 'url' },
  { key: 'trial_days', label: 'Trial Days', format: 'number' },
  { key: 'benefits', label: 'Benefits' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const tierWithPriceFields: Fields = [
  ...tierFields,
  { key: 'currency', label: 'Currency' },
  { key: 'monthly_price', label: 'Monthly Price (cents)', format: 'number' },
  { key: 'yearly_price', label: 'Yearly Price (cents)', format: 'number' },
];

const offerFields: Fields = [
  { key: 'id', label: 'Offer ID' },
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'display_title', label: 'Display Title' },
  { key: 'display_description', label: 'Display Description' },
  { key: 'type', label: 'Discount Type' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'cadence', label: 'Cadence' },
  { key: 'duration', label: 'Duration' },
  { key: 'duration_in_months', label: 'Duration in Months', format: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'redemption_count', label: 'Redemptions', format: 'number' },
  { key: 'redemption_type', label: 'Redemption Type' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'last_redeemed', label: 'Last Redeemed', format: 'datetime' },
];

const offerWithTierFields: Fields = [
  ...offerFields,
  {
    key: 'tier',
    label: 'Tier',
    children: [
      { key: 'id', label: 'Tier ID' },
      { key: 'name', label: 'Name' },
    ],
  },
];

const createdOfferFields: Fields = [
  ...offerFields,
  { key: 'tier', label: 'Tier', children: [{ key: 'id', label: 'Tier ID' }] },
];

const emailFields: Fields = [
  { key: 'id', label: 'Email ID' },
  { key: 'status', label: 'Status' },
  { key: 'subject', label: 'Subject' },
  { key: 'recipient_filter', label: 'Recipient Filter' },
  { key: 'email_count', label: 'Recipients', format: 'number' },
  { key: 'delivered_count', label: 'Delivered', format: 'number' },
  { key: 'opened_count', label: 'Opened', format: 'number' },
  { key: 'failed_count', label: 'Failed', format: 'number' },
  { key: 'submitted_at', label: 'Submitted At', format: 'datetime' },
  { key: 'newsletter_id', label: 'Newsletter ID' },
  { key: 'error', label: 'Error' },
];

const publishedPostFields: Fields = [
  ...postFields,
  { key: 'email', label: 'Email', children: emailFields },
  {
    key: 'newsletter',
    label: 'Newsletter',
    children: [
      { key: 'id', label: 'Newsletter ID' },
      { key: 'name', label: 'Name' },
      { key: 'slug', label: 'Slug' },
      { key: 'status', label: 'Status' },
    ],
  },
];

const listSchema = ({
  key,
  label,
  labelKey,
  items,
}: {
  key: string;
  label: string;
  labelKey: string;
  items: Fields;
}): OutputSchema => ({
  fields: [{ key, label, labelKey, listItems: items }, ...paginationFields],
});

const deleteSchema = ({ idKey, idLabel }: { idKey: string; idLabel: string }): OutputSchema => ({
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: idKey, label: idLabel },
  ],
});

export const ghostPostOutputSchema: OutputSchema = { fields: postFields };
export const ghostPublishPostOutputSchema: OutputSchema = { fields: publishedPostFields };
export const ghostListPostsOutputSchema = listSchema({ key: 'posts', label: 'Posts', labelKey: 'title', items: postFields });
export const ghostDeletePostOutputSchema = deleteSchema({ idKey: 'post_id', idLabel: 'Post ID' });

export const ghostPageOutputSchema: OutputSchema = { fields: pageFields };
export const ghostListPagesOutputSchema = listSchema({ key: 'pages', label: 'Pages', labelKey: 'title', items: pageFields });
export const ghostDeletePageOutputSchema = deleteSchema({ idKey: 'page_id', idLabel: 'Page ID' });

export const ghostTagOutputSchema: OutputSchema = { fields: tagWithCountFields };
export const ghostCreateTagOutputSchema: OutputSchema = { fields: tagFields };
export const ghostListTagsOutputSchema = listSchema({ key: 'tags', label: 'Tags', labelKey: 'name', items: tagWithCountFields });
export const ghostDeleteTagOutputSchema = deleteSchema({ idKey: 'tag_id', idLabel: 'Tag ID' });

export const ghostMemberOutputSchema: OutputSchema = { fields: memberWithAttributionFields };
export const ghostListMembersOutputSchema = listSchema({ key: 'members', label: 'Members', labelKey: 'email', items: memberListFields });
export const ghostGetMemberByEmailOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'member', label: 'Member', children: memberListFields },
  ],
};
export const ghostDeleteMemberOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'member_id', label: 'Member ID' },
    {
      key: 'stripe_subscriptions_cancelled',
      label: 'Stripe Subscriptions Cancelled',
      format: 'boolean',
    },
  ],
};

export const ghostLabelOutputSchema: OutputSchema = { fields: labelWithCountFields };
export const ghostCreateLabelOutputSchema: OutputSchema = { fields: labelFields };
export const ghostListLabelsOutputSchema = listSchema({ key: 'labels', label: 'Labels', labelKey: 'name', items: labelWithCountFields });
export const ghostDeleteLabelOutputSchema = deleteSchema({ idKey: 'label_id', idLabel: 'Label ID' });

export const ghostNewsletterOutputSchema: OutputSchema = { fields: newsletterFields };
export const ghostListNewslettersOutputSchema = listSchema({ key: 'newsletters', label: 'Newsletters', labelKey: 'name', items: newsletterFields });

export const ghostTierOutputSchema: OutputSchema = { fields: tierWithPriceFields };
export const ghostListTiersOutputSchema = listSchema({ key: 'tiers', label: 'Tiers', labelKey: 'name', items: tierWithPriceFields });

export const ghostOfferOutputSchema: OutputSchema = { fields: offerWithTierFields };
export const ghostCreateOfferOutputSchema: OutputSchema = { fields: createdOfferFields };
export const ghostListOffersOutputSchema: OutputSchema = {
  fields: [
    { key: 'offers', label: 'Offers', labelKey: 'name', listItems: offerWithTierFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const ghostUserOutputSchema: OutputSchema = { fields: userFields };
export const ghostListUsersOutputSchema = listSchema({ key: 'users', label: 'Users', labelKey: 'name', items: userFields });
export const ghostGetUserByEmailOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'user', label: 'User', children: userFields },
  ],
};

export const ghostUploadImageOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'Image URL', format: 'image' },
    { key: 'ref', label: 'Reference' },
  ],
};
export const ghostUploadFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'File URL', format: 'url' },
    { key: 'ref', label: 'Reference' },
  ],
};
export const ghostUploadMediaOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'Media URL', format: 'url' },
    { key: 'thumbnail_url', label: 'Thumbnail URL', format: 'image' },
    { key: 'ref', label: 'Reference' },
  ],
};

export const ghostSiteOutputSchema: OutputSchema = {
  fields: [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'version', label: 'Ghost Version' },
    { key: 'locale', label: 'Locale' },
    { key: 'timezone', label: 'Timezone' },
    { key: 'accent_color', label: 'Accent Color' },
    { key: 'logo', label: 'Logo', format: 'image' },
    { key: 'icon', label: 'Icon', format: 'image' },
    { key: 'cover_image', label: 'Cover Image', format: 'image' },
    { key: 'allow_external_signup', label: 'Allows External Signup', format: 'boolean' },
    { key: 'site_uuid', label: 'Site UUID' },
  ],
};

const navigationFields: Fields = [
  { key: 'label', label: 'Label' },
  { key: 'url', label: 'URL', format: 'url' },
];

export const ghostSettingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'timezone', label: 'Timezone' },
    { key: 'locale', label: 'Locale' },
    { key: 'accent_color', label: 'Accent Color' },
    { key: 'logo', label: 'Logo', format: 'image' },
    { key: 'icon', label: 'Icon', format: 'image' },
    { key: 'cover_image', label: 'Cover Image', format: 'image' },
    { key: 'meta_title', label: 'Meta Title' },
    { key: 'meta_description', label: 'Meta Description' },
    { key: 'og_image', label: 'Open Graph Image', format: 'image' },
    { key: 'og_title', label: 'Open Graph Title' },
    { key: 'og_description', label: 'Open Graph Description' },
    { key: 'twitter_image', label: 'X Card Image', format: 'image' },
    { key: 'twitter_title', label: 'X Card Title' },
    { key: 'twitter_description', label: 'X Card Description' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'twitter', label: 'X (Twitter)' },
    { key: 'navigation', label: 'Navigation', labelKey: 'label', listItems: navigationFields },
    {
      key: 'secondary_navigation',
      label: 'Secondary Navigation',
      labelKey: 'label',
      listItems: navigationFields,
    },
    { key: 'active_theme', label: 'Active Theme' },
    { key: 'is_private', label: 'Private Site', format: 'boolean' },
    { key: 'default_content_visibility', label: 'Default Content Visibility' },
    { key: 'members_enabled', label: 'Members Enabled', format: 'boolean' },
    { key: 'members_invite_only', label: 'Members Invite Only', format: 'boolean' },
    { key: 'members_signup_access', label: 'Member Signup Access' },
    { key: 'members_support_address', label: 'Members Support Address' },
    { key: 'paid_members_enabled', label: 'Paid Members Enabled', format: 'boolean' },
    { key: 'portal_name', label: 'Portal Asks for Name', format: 'boolean' },
    { key: 'portal_plans', label: 'Portal Plans' },
    { key: 'portal_default_plan', label: 'Portal Default Plan' },
    { key: 'comments_enabled', label: 'Comments Enabled' },
    { key: 'recommendations_enabled', label: 'Recommendations Enabled', format: 'boolean' },
    { key: 'email_track_opens', label: 'Track Email Opens', format: 'boolean' },
    { key: 'email_track_clicks', label: 'Track Email Clicks', format: 'boolean' },
    { key: 'donations_enabled', label: 'Donations Enabled', format: 'boolean' },
    { key: 'donations_currency', label: 'Donations Currency' },
    { key: 'donations_suggested_amount', label: 'Suggested Donation (cents)', format: 'number' },
    { key: 'editor_default_email_recipients', label: 'Default Email Recipients' },
    { key: 'default_email_address', label: 'Default Email Address', format: 'email' },
    { key: 'support_email_address', label: 'Support Email Address', format: 'email' },
  ],
};

export const ghostMemberStatsOutputSchema: OutputSchema = {
  fields: [
    { key: 'total', label: 'Total Members', format: 'number' },
    { key: 'free', label: 'Free', format: 'number' },
    { key: 'paid', label: 'Paid', format: 'number' },
    { key: 'comped', label: 'Comped', format: 'number' },
    { key: 'gift', label: 'Gift', format: 'number' },
    { key: 'as_of', label: 'As Of', format: 'date' },
    {
      key: 'history',
      label: 'History',
      labelKey: 'date',
      listItems: [
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'free', label: 'Free', format: 'number' },
        { key: 'paid', label: 'Paid', format: 'number' },
        { key: 'comped', label: 'Comped', format: 'number' },
        { key: 'gift', label: 'Gift', format: 'number' },
      ],
    },
  ],
};

export const ghostListMemberActivityOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'events',
      label: 'Events',
      labelKey: 'type',
      listItems: [
        { key: 'type', label: 'Event Type' },
        { key: 'id', label: 'Event ID' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'member_id', label: 'Member ID' },
        { key: 'member_name', label: 'Member Name' },
        { key: 'member_email', label: 'Member Email', format: 'email' },
        { key: 'data', label: 'Event Data' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

export const ghostOriginalMembersOutputSchema: OutputSchema = {
  fields: [
    { key: 'members', label: 'Members', labelKey: 'email', listItems: memberWithAttributionFields },
  ],
};

export const ghostOriginalFindMemberOutputSchema: OutputSchema = {
  fields: [{ key: 'members', label: 'Members', labelKey: 'email', listItems: memberListFields }],
};

export const ghostOriginalFindUserOutputSchema: OutputSchema = {
  fields: [{ key: 'users', label: 'Users', labelKey: 'name', listItems: userBaseFields }],
};

export const ghostOriginalCreatePostOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'posts',
      label: 'Posts',
      labelKey: 'title',
      listItems: postFields.filter((field) => field.key !== 'html'),
    },
  ],
};

const triggerPostPreviousFields: Fields = [
  { key: 'status', label: 'Previous Status' },
  { key: 'published_at', label: 'Previous Published At', format: 'datetime' },
  { key: 'updated_at', label: 'Previous Updated At', format: 'datetime' },
];

const triggerMemberFields: Fields = memberListFields;

export const ghostMemberAddedTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'event', label: 'Event' },
    {
      key: 'member',
      label: 'Member',
      children: [{ key: 'current', label: 'Member', children: triggerMemberFields }],
    },
  ],
};

export const ghostMemberEditedTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'event', label: 'Event' },
    {
      key: 'member',
      label: 'Member',
      children: [
        { key: 'current', label: 'Current Member', children: triggerMemberFields },
        {
          key: 'previous',
          label: 'Changed Fields (Previous Values)',
          children: [
            { key: 'name', label: 'Previous Name' },
            { key: 'note', label: 'Previous Note' },
            { key: 'updated_at', label: 'Previous Updated At', format: 'datetime' },
          ],
        },
      ],
    },
  ],
};

export const ghostMemberDeletedTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'event', label: 'Event' },
    {
      key: 'member',
      label: 'Member',
      children: [{ key: 'previous', label: 'Deleted Member', children: memberCoreFields }],
    },
  ],
};

export const ghostPostPublishedTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'event', label: 'Event' },
    {
      key: 'post',
      label: 'Post',
      children: [
        { key: 'current', label: 'Post', children: postFields },
        { key: 'previous', label: 'Previous Values', children: triggerPostPreviousFields },
      ],
    },
  ],
};

export const ghostPagePublishedTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'event', label: 'Event' },
    {
      key: 'page',
      label: 'Page',
      children: [{ key: 'current', label: 'Page', children: pageFields }],
    },
  ],
};
