import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const pageFields: OutputSchemaField[] = [
  { key: 'count', label: 'Count', format: 'number' },
  {
    key: 'next_page_token',
    label: 'Next Page Token',
    description: 'Pass as Page Token to fetch the next page. Empty on the last page.',
  },
];

const userFields: OutputSchemaField[] = [
  { key: 'uri', label: 'User URI', format: 'url' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'slug', label: 'Slug' },
  { key: 'scheduling_url', label: 'Scheduling URL', format: 'url' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'avatar_url', label: 'Avatar', format: 'image' },
  { key: 'locale', label: 'Locale' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const membershipFields: OutputSchemaField[] = [
  { key: 'uri', label: 'Membership URI', format: 'url' },
  { key: 'role', label: 'Role' },
  { key: 'organization', label: 'Organization URI', format: 'url' },
  { key: 'user', label: 'User', children: userFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const eventTypeFields: OutputSchemaField[] = [
  { key: 'uri', label: 'Event Type URI', format: 'url' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'scheduling_url', label: 'Scheduling URL', format: 'url' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'duration', label: 'Duration (minutes)', format: 'number' },
  { key: 'kind', label: 'Kind' },
  { key: 'type', label: 'Type' },
  { key: 'pooling_type', label: 'Pooling Type' },
  { key: 'secret', label: 'Secret', format: 'boolean' },
  { key: 'color', label: 'Color' },
  { key: 'description_plain', label: 'Description' },
  { key: 'locations', label: 'Locations', labelKey: 'kind', listItems: [{ key: 'kind', label: 'Kind' }, { key: 'location', label: 'Location' }] },
  {
    key: 'profile',
    label: 'Host',
    children: [
      { key: 'name', label: 'Name' },
      { key: 'owner', label: 'Owner URI', format: 'url' },
      { key: 'type', label: 'Type' },
    ],
  },
  {
    key: 'custom_questions',
    label: 'Booking Questions',
    labelKey: 'name',
    listItems: [
      { key: 'name', label: 'Question' },
      { key: 'type', label: 'Type' },
      { key: 'required', label: 'Required', format: 'boolean' },
      { key: 'enabled', label: 'Enabled', format: 'boolean' },
    ],
  },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const availabilityRuleFields: OutputSchemaField[] = [
  { key: 'type', label: 'Type' },
  { key: 'wday', label: 'Weekday' },
  { key: 'date', label: 'Date', format: 'date' },
  {
    key: 'intervals',
    label: 'Intervals',
    labelKey: 'from',
    listItems: [
      { key: 'from', label: 'From' },
      { key: 'to', label: 'To' },
    ],
  },
];

const availabilityScheduleFields: OutputSchemaField[] = [
  { key: 'uri', label: 'Schedule URI', format: 'url' },
  { key: 'name', label: 'Name' },
  { key: 'default', label: 'Default', format: 'boolean' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'user', label: 'User URI', format: 'url' },
  { key: 'rules', label: 'Rules', labelKey: 'wday', listItems: availabilityRuleFields },
];

const eventTypeAvailabilityFields: OutputSchemaField[] = [
  { key: 'event_type', label: 'Event Type URI', format: 'url' },
  { key: 'availability_setting', label: 'Availability Setting' },
  {
    key: 'availability_rule',
    label: 'Availability',
    children: [
      { key: 'uri', label: 'Schedule URI', format: 'url' },
      { key: 'name', label: 'Schedule Name' },
      { key: 'timezone', label: 'Timezone' },
      { key: 'rules', label: 'Rules', labelKey: 'wday', listItems: availabilityRuleFields },
    ],
  },
];

const schedulingLinkFields: OutputSchemaField[] = [
  { key: 'booking_url', label: 'Booking URL', format: 'url' },
  { key: 'owner', label: 'Event Type URI', format: 'url' },
  { key: 'owner_type', label: 'Owner Type' },
];

const cancellationFields: OutputSchemaField[] = [
  { key: 'canceled_by', label: 'Canceled By' },
  { key: 'canceler_type', label: 'Canceler Type' },
  { key: 'reason', label: 'Reason' },
  { key: 'created_at', label: 'Canceled At', format: 'datetime' },
];

const scheduledEventFields: OutputSchemaField[] = [
  { key: 'uri', label: 'Event URI', format: 'url' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'start_time', label: 'Start Time', format: 'datetime' },
  { key: 'end_time', label: 'End Time', format: 'datetime' },
  { key: 'event_type', label: 'Event Type URI', format: 'url' },
  {
    key: 'location',
    label: 'Location',
    children: [
      { key: 'type', label: 'Type' },
      { key: 'join_url', label: 'Join URL', format: 'url' },
      { key: 'location', label: 'Location' },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    key: 'invitees_counter',
    label: 'Invitees',
    children: [
      { key: 'active', label: 'Active', format: 'number' },
      { key: 'total', label: 'Total', format: 'number' },
      { key: 'limit', label: 'Limit', format: 'number' },
    ],
  },
  {
    key: 'event_memberships',
    label: 'Hosts',
    labelKey: 'user_name',
    listItems: [
      { key: 'user', label: 'User URI', format: 'url' },
      { key: 'user_name', label: 'Name' },
      { key: 'user_email', label: 'Email', format: 'email' },
    ],
  },
  { key: 'cancellation', label: 'Cancellation', children: cancellationFields },
  { key: 'meeting_notes_plain', label: 'Meeting Notes' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const inviteeFields: OutputSchemaField[] = [
  { key: 'uri', label: 'Invitee URI', format: 'url' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'status', label: 'Status' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'event', label: 'Event URI', format: 'url' },
  { key: 'rescheduled', label: 'Rescheduled', format: 'boolean' },
  { key: 'cancel_url', label: 'Cancel URL', format: 'url' },
  { key: 'reschedule_url', label: 'Reschedule URL', format: 'url' },
  {
    key: 'questions_and_answers',
    label: 'Answers',
    labelKey: 'question',
    listItems: [
      { key: 'question', label: 'Question' },
      { key: 'answer', label: 'Answer' },
    ],
  },
  {
    key: 'tracking',
    label: 'Tracking',
    children: [
      { key: 'utm_source', label: 'UTM Source' },
      { key: 'utm_medium', label: 'UTM Medium' },
      { key: 'utm_campaign', label: 'UTM Campaign' },
      { key: 'utm_content', label: 'UTM Content' },
      { key: 'utm_term', label: 'UTM Term' },
    ],
  },
  {
    key: 'no_show',
    label: 'No Show',
    children: [
      { key: 'uri', label: 'No Show URI', format: 'url' },
      { key: 'created_at', label: 'Marked At', format: 'datetime' },
    ],
  },
  {
    key: 'payment',
    label: 'Payment',
    children: [
      { key: 'external_id', label: 'Payment ID' },
      { key: 'provider', label: 'Provider' },
      { key: 'amount', label: 'Amount', format: 'number' },
      { key: 'currency', label: 'Currency' },
      { key: 'successful', label: 'Successful', format: 'boolean' },
      { key: 'terms', label: 'Terms' },
    ],
  },
  {
    key: 'reconfirmation',
    label: 'Reconfirmation',
    children: [
      { key: 'created_at', label: 'Requested At', format: 'datetime' },
      { key: 'confirmed_at', label: 'Confirmed At', format: 'datetime' },
    ],
  },
  { key: 'text_reminder_number', label: 'Text Reminder Number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

export const userOutputSchema: OutputSchema = {
  fields: [...userFields, { key: 'current_organization', label: 'Organization URI', format: 'url' }],
};

export const organizationOutputSchema: OutputSchema = {
  fields: [
    { key: 'uri', label: 'Organization URI', format: 'url' },
    { key: 'name', label: 'Name' },
    { key: 'plan', label: 'Plan' },
    { key: 'stage', label: 'Stage' },
    { key: 'kind', label: 'Kind' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const organizationMembershipsOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Members', labelKey: 'user.name', listItems: membershipFields }, ...pageFields],
};

export const organizationMembershipOutputSchema: OutputSchema = {
  fields: membershipFields,
};

export const findUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'user', label: 'User', children: userFields },
    { key: 'role', label: 'Role' },
    { key: 'membership_uri', label: 'Membership URI', format: 'url' },
  ],
};

export const eventTypesOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Event Types', labelKey: 'name', listItems: eventTypeFields }, ...pageFields],
};

export const eventTypeOutputSchema: OutputSchema = {
  fields: eventTypeFields,
};

export const eventTypeHostsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Hosts',
      labelKey: 'member.name',
      listItems: [
        { key: 'uri', label: 'Host Membership URI', format: 'url' },
        { key: 'member', label: 'Host', children: userFields },
        { key: 'created_at', label: 'Added At', format: 'datetime' },
      ],
    },
    ...pageFields,
  ],
};

export const availableTimesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Available Times',
      labelKey: 'start_time',
      listItems: [
        { key: 'start_time', label: 'Start Time', format: 'datetime' },
        { key: 'status', label: 'Status' },
        { key: 'invitees_remaining', label: 'Spots Left', format: 'number' },
        { key: 'scheduling_url', label: 'Booking URL', format: 'url' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const userBusyTimesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Busy Times',
      labelKey: 'start_time',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'start_time', label: 'Start Time', format: 'datetime' },
        { key: 'end_time', label: 'End Time', format: 'datetime' },
        { key: 'buffered_start_time', label: 'Buffered Start Time', format: 'datetime' },
        { key: 'buffered_end_time', label: 'Buffered End Time', format: 'datetime' },
        { key: 'event', label: 'Event', children: [{ key: 'uri', label: 'Event URI', format: 'url' }] },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const eventTypeAvailabilityOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Availability Schedules', labelKey: 'availability_rule.name', listItems: eventTypeAvailabilityFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const updateEventTypeAvailabilityOutputSchema: OutputSchema = {
  fields: eventTypeAvailabilityFields,
};

export const userAvailabilitySchedulesOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Availability Schedules', labelKey: 'name', listItems: availabilityScheduleFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const userAvailabilityScheduleOutputSchema: OutputSchema = {
  fields: availabilityScheduleFields,
};

export const userLocationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Locations',
      labelKey: 'kind',
      listItems: [
        { key: 'kind', label: 'Kind' },
        { key: 'connected', label: 'Connected', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const schedulingLinkOutputSchema: OutputSchema = {
  fields: schedulingLinkFields,
};

export const shareOutputSchema: OutputSchema = {
  fields: [
    { key: 'uri', label: 'Share URI', format: 'url' },
    { key: 'scheduling_links', label: 'Booking Links', labelKey: 'booking_url', listItems: schedulingLinkFields },
    {
      key: 'share_override',
      label: 'Overrides',
      children: [
        { key: 'name', label: 'Name' },
        { key: 'duration', label: 'Duration (minutes)', format: 'number' },
        { key: 'period_type', label: 'Booking Window' },
        { key: 'start_date', label: 'Start Date', format: 'date' },
        { key: 'end_date', label: 'End Date', format: 'date' },
        { key: 'hide_location', label: 'Hide Location', format: 'boolean' },
      ],
    },
  ],
};

export const scheduledEventsOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Events', labelKey: 'name', listItems: scheduledEventFields }, ...pageFields],
};

export const scheduledEventOutputSchema: OutputSchema = {
  fields: scheduledEventFields,
};

export const findInviteeBookingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'events', label: 'Events', labelKey: 'start_time', listItems: scheduledEventFields },
  ],
};

export const cancellationOutputSchema: OutputSchema = {
  fields: cancellationFields,
};

export const eventInviteesOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Invitees', labelKey: 'name', listItems: inviteeFields }, ...pageFields],
};

export const eventInviteeOutputSchema: OutputSchema = {
  fields: inviteeFields,
};

export const inviteeTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'event', label: 'Webhook Event' },
    { key: 'created_at', label: 'Received At', format: 'datetime' },
    {
      key: 'payload',
      label: 'Invitee',
      children: [
        ...inviteeFields,
        { key: 'cancellation', label: 'Cancellation', children: cancellationFields },
        {
          key: 'scheduled_event',
          label: 'Scheduled Event',
          children: scheduledEventFields,
        },
      ],
    },
  ],
};
