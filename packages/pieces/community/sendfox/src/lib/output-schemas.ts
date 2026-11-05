import { OutputSchema } from '@activepieces/pieces-framework';

const paginationFields: OutputSchema['fields'] = [
  { key: 'current_page', label: 'Current Page', format: 'number' },
  { key: 'last_page', label: 'Last Page', format: 'number' },
  { key: 'per_page', label: 'Per Page', format: 'number' },
  { key: 'from', label: 'First Item Number', format: 'number' },
  { key: 'to', label: 'Last Item Number', format: 'number' },
  { key: 'total', label: 'Total', format: 'number' },
  { key: 'path', label: 'Path', format: 'url' },
  { key: 'first_page_url', label: 'First Page URL', format: 'url' },
  { key: 'last_page_url', label: 'Last Page URL', format: 'url' },
  { key: 'next_page_url', label: 'Next Page URL', format: 'url' },
  { key: 'prev_page_url', label: 'Previous Page URL', format: 'url' },
  {
    key: 'links',
    label: 'Page Links',
    labelKey: 'label',
    listItems: [
      { key: 'url', label: 'URL', format: 'url' },
      { key: 'label', label: 'Label' },
      { key: 'active', label: 'Active', format: 'boolean' },
    ],
  },
];

const contactFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Contact ID', format: 'number' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'ip_address', label: 'IP Address' },
  { key: 'via_api', label: 'Added via API', format: 'boolean' },
  { key: 'confirmation_sent_count', label: 'Confirmation Emails Sent', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const listFields: OutputSchema['fields'] = [
  { key: 'id', label: 'List ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'public_description', label: 'Public Description' },
  { key: 'subscribed_contacts_count', label: 'Subscribed Contacts', format: 'number' },
  { key: 'unsubscribed_contacts_count', label: 'Unsubscribed Contacts', format: 'number' },
  { key: 'confirmation_campaign_id', label: 'Confirmation Campaign ID', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const tagFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Tag ID', format: 'number' },
  { key: 'user_id', label: 'User ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const automationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Automation ID', format: 'number' },
  { key: 'user_id', label: 'User ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'active', label: 'Active', format: 'number' },
  { key: 'template', label: 'Is Template', format: 'number' },
  { key: 'automation_template_id', label: 'Automation Template ID', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'deleted_at', label: 'Deleted At', format: 'datetime' },
];

const formFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Form ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'user_id', label: 'User ID', format: 'number' },
  { key: 'url', label: 'Form URL', format: 'url' },
  { key: 'redirect_url', label: 'Redirect URL', format: 'url' },
  { key: 'landing_page_id', label: 'Landing Page ID', format: 'number' },
  { key: 'gdpr_required', label: 'GDPR Consent Required', format: 'number' },
  { key: 'gdpr_text', label: 'GDPR Text' },
  { key: 'json_params', label: 'Form Settings' },
  { key: 'recaptcha_enabled_at', label: 'reCAPTCHA Enabled At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const contactFieldFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Field ID', format: 'number' },
  { key: 'label', label: 'Label' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
];

const statsFields: OutputSchema['fields'] = [
  { key: 'sent_count', label: 'Sent', format: 'number' },
  { key: 'unique_open_count', label: 'Unique Opens', format: 'number' },
  { key: 'unique_click_count', label: 'Unique Clicks', format: 'number' },
  { key: 'unsubscribe_count', label: 'Unsubscribes', format: 'number' },
  { key: 'bounce_count', label: 'Bounces', format: 'number' },
  { key: 'spam_count', label: 'Spam Reports', format: 'number' },
  { key: 'open_rate', label: 'Open Rate', format: 'number' },
  { key: 'click_rate', label: 'Click Rate', format: 'number' },
  { key: 'unsubscribe_rate', label: 'Unsubscribe Rate', format: 'number' },
  { key: 'bounce_rate', label: 'Bounce Rate', format: 'number' },
  { key: 'spam_rate', label: 'Spam Rate', format: 'number' },
];

const SUBJECT_TESTS = [
  ['exclamationTest', 'Exclamation'],
  ['tooShortTest', 'Too Short'],
  ['tooLongTest', 'Too Long'],
  ['fwdReTest', 'Fwd/Re Prefix'],
  ['freeTest', 'Uses "Free"'],
  ['capsWordsTest', 'All-Caps Words'],
  ['lowercaseTest', 'All Lowercase'],
  ['questionTest', 'Question'],
  ['punctuationTest', 'Punctuation'],
  ['personalizationTest', 'Personalization'],
  ['emojiTest', 'Emoji'],
  ['badWordTest', 'Bad Words'],
  ['spamWordTest', 'Spam Words'],
];

const campaignFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Campaign ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'subject', label: 'Subject' },
  { key: 'slugged_subject', label: 'Subject Slug' },
  { key: 'preview_text', label: 'Preview Text' },
  { key: 'preview_text_auto', label: 'Auto Preview Text' },
  { key: 'html', label: 'HTML' },
  { key: 'from_name', label: 'From Name' },
  { key: 'from_email', label: 'From Email', format: 'email' },
  { key: 'user_id', label: 'User ID', format: 'number' },
  { key: 'automation_item_id', label: 'Automation Item ID', format: 'number' },
  { key: 'campaign_layout_id', label: 'Campaign Layout ID', format: 'number' },
  { key: 'smart_campaign_id', label: 'Smart Campaign ID', format: 'number' },
  { key: 'campaign_category_id', label: 'Campaign Category ID', format: 'number' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'scheduled_at', label: 'Scheduled At', format: 'datetime' },
  { key: 'sent_at', label: 'Sent At', format: 'datetime' },
  { key: 'throttled_at', label: 'Throttled At', format: 'datetime' },
  { key: 'cancelled_at', label: 'Cancelled At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'is_web_gated', label: 'Web Gated', format: 'boolean' },
  { key: 'active_contacts_only', label: 'Active Contacts Only', format: 'number' },
  { key: 'attempted_send_count', label: 'Attempted Sends', format: 'number' },
  { key: 'sent_count', label: 'Sent', format: 'number' },
  { key: 'unique_open_count', label: 'Unique Opens', format: 'number' },
  { key: 'unique_click_count', label: 'Unique Clicks', format: 'number' },
  { key: 'unsubscribe_count', label: 'Unsubscribes', format: 'number' },
  { key: 'bounce_count', label: 'Bounces', format: 'number' },
  { key: 'spam_count', label: 'Spam Reports', format: 'number' },
  {
    key: 'subject_tester_results',
    label: 'Subject Line Test',
    children: [
      { key: 'subject', label: 'Subject' },
      { key: 'words', label: 'Word Count' },
      { key: 'score', label: 'Score', format: 'number' },
      { key: 'letterGrade', label: 'Letter Grade' },
      { key: 'badWords', label: 'Bad Words Found' },
      { key: 'spamWords', label: 'Spam Words Found' },
      {
        key: 'testMethods',
        label: 'Test Weights',
        children: SUBJECT_TESTS.map(([key, label]) => ({ key, label, format: 'number' as const })),
      },
      {
        key: 'testResults',
        label: 'Test Results',
        children: SUBJECT_TESTS.map(([key, label]) => ({ key, label, format: 'boolean' as const })),
      },
    ],
  },
];

const savedContentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'html', label: 'HTML' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

export const createContactOutputSchema: OutputSchema = {
  fields: [...contactFields, { key: 'created_ago', label: 'Created Ago' }],
};

export const sendfoxAddContactToListOutputSchema: OutputSchema = {
  fields: [
    ...contactFields,
    { key: 'form_id', label: 'Form ID', format: 'number' },
    { key: 'contact_import_id', label: 'Contact Import ID', format: 'number' },
    { key: 'social_platform_id', label: 'Social Platform ID' },
    { key: 'unsubscribed_at', label: 'Unsubscribed At', format: 'datetime' },
    { key: 'bounced_at', label: 'Bounced At', format: 'datetime' },
    { key: 'invalid_at', label: 'Invalid At', format: 'datetime' },
    { key: 'inactive_at', label: 'Inactive At', format: 'datetime' },
    { key: 'confirmed_at', label: 'Confirmed At', format: 'datetime' },
    { key: 'confirmation_sent_at', label: 'Confirmation Sent At', format: 'datetime' },
    { key: 'first_sent_at', label: 'First Email Sent At', format: 'datetime' },
    { key: 'last_sent_at', label: 'Last Email Sent At', format: 'datetime' },
    { key: 'last_opened_at', label: 'Last Opened At', format: 'datetime' },
    { key: 'last_clicked_at', label: 'Last Clicked At', format: 'datetime' },
    { key: 'contact_fields', label: 'Custom Fields' },
    { key: 'created_ago', label: 'Created Ago' },
  ],
};

export const sendfoxAddTagToContactOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tags',
      label: 'Contact Tags',
      labelKey: 'name',
      listItems: [
        ...tagFields,
        {
          key: 'pivot',
          label: 'Tag Assignment',
          children: [
            { key: 'contact_id', label: 'Contact ID', format: 'number' },
            { key: 'contact_tag_id', label: 'Tag ID', format: 'number' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Tag Count', format: 'number' },
  ],
};

export const sendfoxGetAutomationOutputSchema: OutputSchema = {
  fields: [
    ...automationFields,
    {
      key: 'automation_triggers',
      label: 'Triggers',
      labelKey: 'type',
      listItems: [
        { key: 'id', label: 'Trigger ID', format: 'number' },
        { key: 'automation_id', label: 'Automation ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'list_id', label: 'List ID', format: 'number' },
        { key: 'contact_tag_id', label: 'Tag ID', format: 'number' },
        { key: 'campaign_id', label: 'Campaign ID', format: 'number' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
    { key: 'automation_items', label: 'Steps' },
  ],
};

export const sendfoxGetCampaignOutputSchema: OutputSchema = {
  fields: [
    ...campaignFields,
    { key: 'lists', label: 'Lists' },
    { key: 'excluded_lists', label: 'Excluded Lists' },
    { key: 'contact_tags', label: 'Tags' },
    { key: 'excluded_contact_tags', label: 'Excluded Tags' },
  ],
};

export const sendfoxGetCampaignStatsOutputSchema: OutputSchema = {
  fields: [
    ...statsFields,
    {
      key: 'link_stats',
      label: 'Link Clicks',
      labelKey: 'url',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'clicks', label: 'Clicks', format: 'number' },
      ],
    },
  ],
};

export const sendfoxGetContactFieldOutputSchema: OutputSchema = {
  fields: contactFieldFields,
};

export const sendfoxGetCurrentUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'User ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'country', label: 'Country' },
    { key: 'timezone', label: 'Timezone' },
    { key: 'language', label: 'Language' },
    { key: 'vanity_path', label: 'Vanity Path' },
    { key: 'disabled_at', label: 'Disabled At', format: 'datetime' },
    { key: 'device_verification_enabled', label: 'Device Verification Enabled', format: 'boolean' },
    { key: 'disable_optimization', label: 'Optimization Disabled', format: 'number' },
    { key: 'opt_out_product_updates_at', label: 'Opted Out of Product Updates At', format: 'datetime' },
    { key: 'contact_referrals_enabled_at', label: 'Contact Referrals Enabled At', format: 'datetime' },
    { key: 'transactional_enabled_at', label: 'Transactional Enabled At', format: 'datetime' },
    { key: 'transactional_paused_at', label: 'Transactional Paused At', format: 'datetime' },
    { key: 'transactional_pause_reason', label: 'Transactional Pause Reason' },
    { key: 'transactional_digest_enabled', label: 'Transactional Digest Enabled' },
    { key: 'transactional_first_live_at', label: 'First Live Transactional Email At', format: 'datetime' },
    { key: 'user_agent', label: 'User Agent' },
    { key: 'google_id', label: 'Google ID' },
  ],
};

export const sendfoxGetFormOutputSchema: OutputSchema = {
  fields: [
    ...formFields,
    { key: 'lists', label: 'Lists', labelKey: 'name', listItems: listFields },
  ],
};

export const sendfoxGetListOutputSchema: OutputSchema = {
  fields: [
    ...listFields,
    { key: 'average_email_open_percent', label: 'Average Open Rate (%)', format: 'number' },
    { key: 'average_email_click_percent', label: 'Average Click Rate (%)', format: 'number' },
  ],
};

export const sendfoxGetTagOutputSchema: OutputSchema = {
  fields: [...tagFields, { key: 'contacts_count', label: 'Contacts', format: 'number' }],
};

export const sendfoxListAutomationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Automations', labelKey: 'title', listItems: automationFields },
    ...paginationFields,
  ],
};

export const sendfoxListCampaignTemplatesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Templates',
      labelKey: 'name',
      listItems: [
        ...savedContentFields,
        { key: 'subject', label: 'Subject' },
        { key: 'preview_text', label: 'Preview Text' },
        { key: 'campaign_layout_id', label: 'Campaign Layout ID' },
      ],
    },
    ...paginationFields,
  ],
};

export const sendfoxListCampaignSectionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Sections', labelKey: 'name', listItems: savedContentFields },
    ...paginationFields,
  ],
};

export const sendfoxListCampaignStatsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Campaign Stats',
      labelKey: 'id',
      listItems: [{ key: 'id', label: 'Campaign ID', format: 'number' }, ...statsFields],
    },
  ],
};

export const sendfoxListCampaignsOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Campaigns', labelKey: 'title', listItems: campaignFields },
    ...paginationFields,
  ],
};

export const sendfoxListContactFieldsOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Contact Fields', labelKey: 'label', listItems: contactFieldFields },
    ...paginationFields,
  ],
};

export const sendfoxListFormsOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Forms', labelKey: 'title', listItems: formFields },
    ...paginationFields,
  ],
};

export const sendfoxListListsOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Lists', labelKey: 'name', listItems: listFields },
    ...paginationFields,
  ],
};

export const sendfoxListTagsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Tags',
      labelKey: 'name',
      listItems: [...tagFields, { key: 'contacts_count', label: 'Contacts', format: 'number' }],
    },
    ...paginationFields,
  ],
};

export const createListOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'lists',
      label: 'Created List',
      value: '',
      listItems: [
        ...listFields,
        { key: 'user_id', label: 'User ID', format: 'number' },
        { key: 'average_email_open_percent', label: 'Average Open Rate (%)', format: 'number' },
        { key: 'average_email_click_percent', label: 'Average Click Rate (%)', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
  ],
};

export const unsubscribeContactOutputSchema: OutputSchema = {
  itemLabel: '{email}',
  fields: [
    {
      key: 'contacts',
      label: 'Unsubscribed Contact',
      value: '',
      listItems: [
        { key: 'id', label: 'Contact ID', format: 'number' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'ip_address', label: 'IP Address' },
        { key: 'unsubscribed_at', label: 'Unsubscribed At', format: 'datetime' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
  ],
};
