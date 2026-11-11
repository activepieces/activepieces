import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const locationFields: OutputSchemaField[] = [
  { key: 'address1', label: 'Address 1' },
  { key: 'address2', label: 'Address 2' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'region', label: 'Region' },
  { key: 'zip', label: 'Zip' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'ip', label: 'IP Address' },
  { key: 'latitude', label: 'Latitude', format: 'number' },
  { key: 'longitude', label: 'Longitude', format: 'number' },
];

const profileIdentityFields: OutputSchemaField[] = [
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone_number', label: 'Phone Number' },
  { key: 'external_id', label: 'External ID' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'organization', label: 'Organization' },
  { key: 'locale', label: 'Locale' },
  { key: 'title', label: 'Job Title' },
  { key: 'image', label: 'Image', format: 'url' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'updated', label: 'Updated', format: 'datetime' },
  { key: 'last_event_date', label: 'Last Event Date', format: 'datetime' },
];

const subscriptionsField: OutputSchemaField = {
  key: 'subscriptions',
  label: 'Subscriptions',
  description: 'Email and SMS marketing consent. Present only when subscriptions were requested.',
};

const rawProfileAttributes: OutputSchemaField[] = [
  ...profileIdentityFields,
  { key: 'location', label: 'Location', children: locationFields },
  { key: 'properties', label: 'Custom Properties' },
  subscriptionsField,
  { key: 'predictive_analytics', label: 'Predictive Analytics', description: 'Present only when requested; empty without enough order history.' },
];

const rawProfile: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Profile',
      description: 'The Klaviyo profile record in its raw JSON:API form (main fields shown).',
      children: [
        { key: 'id', label: 'Profile ID' },
        { key: 'type', label: 'Type' },
        { key: 'attributes', label: 'Attributes', children: rawProfileAttributes },
      ],
    },
  ],
};

const upsertProfile: OutputSchema = {
  fields: [
    ...rawProfile.fields,
    { key: 'created', label: 'Created New Profile', format: 'boolean', description: 'True when no matching profile existed and a new one was created.' },
  ],
};

const flatProfileFields: OutputSchemaField[] = [
  { key: 'id', label: 'Profile ID' },
  ...profileIdentityFields,
  { key: 'location', label: 'Location', children: locationFields },
  { key: 'properties', label: 'Custom Properties' },
];

const aiProfile: OutputSchema = {
  fields: [
    ...flatProfileFields,
    subscriptionsField,
    { key: 'list_ids', label: 'List IDs', description: 'Present only when memberships were requested.' },
    { key: 'segment_ids', label: 'Segment IDs', description: 'Present only when memberships were requested.' },
  ],
};

const pageFields: OutputSchemaField[] = [
  { key: 'next_cursor', label: 'Next Cursor', description: 'Pass as Cursor to get the next page; null on the last page.' },
  { key: 'has_more', label: 'Has More', format: 'boolean' },
];

const aiProfilePage: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Profiles',
      labelKey: 'email',
      listItems: [
        ...flatProfileFields,
        { key: 'joined_group_at', label: 'Joined At', format: 'datetime', description: 'Present only when listing list or segment members.' },
      ],
    },
    ...pageFields,
  ],
};

const listFields: OutputSchemaField[] = [
  { key: 'id', label: 'List ID' },
  { key: 'name', label: 'Name' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'updated', label: 'Updated', format: 'datetime' },
  { key: 'opt_in_process', label: 'Opt-in Process', description: 'single_opt_in or double_opt_in.' },
];

const aiListPage: OutputSchema = {
  fields: [{ key: 'items', label: 'Lists', labelKey: 'name', listItems: listFields }, ...pageFields],
};

const aiList: OutputSchema = {
  fields: [...listFields, { key: 'profile_count', label: 'Profile Count', format: 'number' }],
};

const aiSegmentPage: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Segments',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Segment ID' },
        { key: 'name', label: 'Name' },
        { key: 'created', label: 'Created', format: 'datetime' },
        { key: 'updated', label: 'Updated', format: 'datetime' },
        { key: 'is_active', label: 'Active', format: 'boolean' },
        { key: 'is_processing', label: 'Processing', format: 'boolean' },
        { key: 'is_starred', label: 'Starred', format: 'boolean' },
      ],
    },
    ...pageFields,
  ],
};

const aiMetricPage: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Metrics',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Metric ID' },
        { key: 'name', label: 'Name' },
        { key: 'created', label: 'Created', format: 'datetime' },
        { key: 'updated', label: 'Updated', format: 'datetime' },
        {
          key: 'integration',
          label: 'Integration',
          children: [
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
          ],
        },
      ],
    },
    ...pageFields,
  ],
};

const eventFields: OutputSchemaField[] = [
  { key: 'id', label: 'Event ID' },
  { key: 'uuid', label: 'UUID' },
  { key: 'datetime', label: 'Event Time', format: 'datetime' },
  { key: 'timestamp', label: 'Event Time (Unix Seconds)', format: 'number' },
  { key: 'metric_id', label: 'Metric ID' },
  { key: 'profile_id', label: 'Profile ID' },
  { key: 'event_properties', label: 'Event Properties' },
];

const aiEventPage: OutputSchema = {
  fields: [{ key: 'items', label: 'Events', labelKey: 'datetime', listItems: eventFields }, ...pageFields],
};

const event: OutputSchema = { fields: eventFields };

const aiConsent: OutputSchema = {
  fields: [
    { key: 'accepted', label: 'Accepted', format: 'boolean', description: 'Klaviyo accepted the job (HTTP 202); it is applied asynchronously.' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'phone_number', label: 'Phone Number' },
    { key: 'channels', label: 'Channels' },
    { key: 'list_id', label: 'List ID' },
  ],
};

const triggerProfileFields: OutputSchemaField[] = [
  { key: 'id', label: 'Profile ID' },
  ...profileIdentityFields,
  { key: 'full_name', label: 'Full Name' },
  ...locationFields,
];

const triggerProfile: OutputSchema = { fields: triggerProfileFields };

const triggerGroupProfile: OutputSchema = {
  fields: [
    ...triggerProfileFields,
    { key: 'joined_group_at', label: 'Joined At', format: 'datetime' },
    { key: 'target_type', label: 'Target Type', description: 'list or segment.' },
    { key: 'target_id', label: 'List or Segment ID' },
  ],
};

const jobFields: OutputSchemaField[] = [
  { key: 'success', label: 'Success', format: 'boolean' },
  { key: 'job_id', label: 'Job ID', description: 'Null when Klaviyo returns no job ID; Klaviyo answers these jobs with HTTP 202 and an empty body, so it is null in practice. Kept for compatibility.' },
  { key: 'profiles_count', label: 'Profiles', format: 'number' },
  { key: 'list_id', label: 'List ID' },
];

const subscribeProfile: OutputSchema = {
  fields: [
    ...jobFields,
    { key: 'subscribed_email', label: 'Email Subscribed', format: 'boolean' },
    { key: 'subscribed_sms', label: 'SMS Subscribed', format: 'boolean' },
    { key: 'historical_import', label: 'Historical Import', format: 'boolean' },
  ],
};

const unsubscribeProfile: OutputSchema = {
  fields: [
    ...jobFields,
    { key: 'unsubscribed_email', label: 'Email Unsubscribed', format: 'boolean' },
    { key: 'unsubscribed_sms', label: 'SMS Unsubscribed', format: 'boolean' },
    { key: 'unsubscribed_sms_transactional', label: 'SMS Transactional Unsubscribed', format: 'boolean' },
  ],
};

const listMembershipAdded: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    { key: 'profiles_added', label: 'Profiles Added', format: 'number' },
  ],
};

const listMembershipRemoved: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    { key: 'profiles_removed', label: 'Profiles Removed', format: 'number' },
  ],
};

const createList: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'list',
      label: 'List',
      children: [
        { key: 'id', label: 'List ID' },
        { key: 'type', label: 'Type' },
        {
          key: 'attributes',
          label: 'Attributes',
          children: [
            { key: 'name', label: 'Name' },
            { key: 'created', label: 'Created', format: 'datetime' },
            { key: 'updated', label: 'Updated', format: 'datetime' },
            { key: 'opt_in_process', label: 'Opt-in Process' },
          ],
        },
      ],
    },
  ],
};

const findListByName: OutputSchema = {
  fields: [
    { key: 'success', label: 'Found', format: 'boolean' },
    { key: 'message', label: 'Message' },
    { key: 'lists', label: 'Lists', labelKey: 'name', listItems: listFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const findProfile: OutputSchema = {
  fields: [
    { key: 'success', label: 'Found', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'profiles',
      label: 'Profiles',
      labelKey: 'email',
      listItems: [
        { key: 'id', label: 'Profile ID' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'phone_number', label: 'Phone Number' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'full_name', label: 'Full Name' },
        { key: 'external_id', label: 'External ID' },
        { key: 'created', label: 'Created', format: 'datetime' },
        { key: 'updated', label: 'Updated', format: 'datetime' },
        { key: 'full_profile', label: 'All Attributes', children: rawProfileAttributes },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const findTag: OutputSchema = {
  fields: [
    { key: 'success', label: 'Found', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'tags',
      label: 'Tags',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Tag ID' },
        { key: 'name', label: 'Name' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'search_query', label: 'Search Query' },
  ],
};

const trackEvent: OutputSchema = {
  fields: [
    { key: 'accepted', label: 'Accepted', format: 'boolean', description: 'Klaviyo accepted the event (HTTP 202); it is processed asynchronously.' },
    { key: 'metric_name', label: 'Event Name' },
    { key: 'unique_id', label: 'Unique ID' },
  ],
};

const tagGroupFields: OutputSchemaField[] = [
  { key: 'success', label: 'Success', format: 'boolean' },
  { key: 'tag_id', label: 'Tag ID' },
  { key: 'target_type', label: 'Target Type' },
  { key: 'target_ids', label: 'List or Segment IDs' },
];

const deleteList: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'list_id', label: 'List ID' },
  ],
};

export const klaviyoOutputSchemas = {
  rawProfile,
  upsertProfile,
  aiProfile,
  aiProfilePage,
  aiListPage,
  aiList,
  aiSegmentPage,
  aiMetricPage,
  aiEventPage,
  aiConsent,
  event,
  triggerProfile,
  triggerGroupProfile,
  subscribeProfile,
  unsubscribeProfile,
  listMembershipAdded,
  listMembershipRemoved,
  createList,
  findListByName,
  findProfile,
  findTag,
  trackEvent,
  tagGroupAdded: { fields: tagGroupFields },
  tagGroupRemoved: { fields: tagGroupFields },
  deleteList,
};
