import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const transcriptSnake: OutputSchemaField[] = [
  {
    key: 'speaker',
    label: 'Speaker',
    children: [
      { key: 'display_name', label: 'Name' },
      { key: 'matched_calendar_invitee_email', label: 'Matched Invitee Email', format: 'email' },
    ],
  },
  { key: 'text', label: 'Text' },
  { key: 'timestamp', label: 'Timestamp (HH:MM:SS)' },
];

const summarySnake: OutputSchemaField[] = [
  { key: 'template_name', label: 'Template' },
  { key: 'markdown_formatted', label: 'Summary (Markdown)' },
];

const meetingFieldsSnake: OutputSchemaField[] = [
  { key: 'recording_id', label: 'Recording ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'meeting_title', label: 'Calendar Event Title' },
  { key: 'meeting_type', label: 'Meeting Type' },
  { key: 'url', label: 'Fathom URL', format: 'url' },
  { key: 'share_url', label: 'Share URL', format: 'url' },
  { key: 'meeting_url', label: 'Meeting Link', format: 'url', description: 'The Zoom, Meet or Teams link of the call, when known.' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'scheduled_start_time', label: 'Scheduled Start', format: 'datetime' },
  { key: 'scheduled_end_time', label: 'Scheduled End', format: 'datetime' },
  { key: 'recording_start_time', label: 'Recording Start', format: 'datetime' },
  { key: 'recording_end_time', label: 'Recording End', format: 'datetime' },
  { key: 'calendar_invitees_domains_type', label: 'Invitee Domains Type', description: 'only_internal or one_or_more_external.' },
  { key: 'shared_with', label: 'Shared With', description: 'no_teams, single_team, multiple_teams or all_teams.' },
  { key: 'transcript_language', label: 'Transcript Language' },
  {
    key: 'recorded_by',
    label: 'Recorded By',
    children: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'email_domain', label: 'Email Domain' },
      { key: 'team', label: 'Team' },
    ],
  },
  {
    key: 'calendar_invitees',
    label: 'Calendar Invitees',
    labelKey: 'name',
    listItems: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'email_domain', label: 'Email Domain' },
      { key: 'is_external', label: 'External', format: 'boolean' },
      { key: 'matched_speaker_display_name', label: 'Matched Speaker' },
    ],
  },
  { key: 'default_summary', label: 'Summary', description: 'Only when summaries are included.', children: summarySnake },
  {
    key: 'action_items',
    label: 'Action Items',
    labelKey: 'description',
    description: 'Only when action items are included.',
    listItems: [
      { key: 'description', label: 'Description' },
      { key: 'completed', label: 'Completed', format: 'boolean' },
      { key: 'user_generated', label: 'Added by a User', format: 'boolean' },
      { key: 'recording_timestamp', label: 'Recording Timestamp' },
      { key: 'recording_playback_url', label: 'Playback URL', format: 'url' },
      {
        key: 'assignee',
        label: 'Assignee',
        children: [
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email', format: 'email' },
          { key: 'team', label: 'Team' },
        ],
      },
    ],
  },
  {
    key: 'highlights',
    label: 'Highlights',
    labelKey: 'summary',
    description: 'Only when highlights are included.',
    listItems: [
      { key: 'type', label: 'Type' },
      { key: 'summary', label: 'Summary' },
      { key: 'text', label: 'Text' },
      { key: 'start_time', label: 'Start (seconds)', format: 'number' },
      { key: 'end_time', label: 'End (seconds)', format: 'number' },
    ],
  },
  { key: 'transcript', label: 'Transcript', description: 'Only when the transcript is included.', listItems: transcriptSnake },
  {
    key: 'crm_matches',
    label: 'CRM Matches',
    description: 'Only when CRM matches are included.',
    children: [
      {
        key: 'contacts',
        label: 'Contacts',
        labelKey: 'name',
        listItems: [
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email', format: 'email' },
          { key: 'record_url', label: 'Record URL', format: 'url' },
        ],
      },
      {
        key: 'companies',
        label: 'Companies',
        labelKey: 'name',
        listItems: [
          { key: 'name', label: 'Name' },
          { key: 'record_url', label: 'Record URL', format: 'url' },
        ],
      },
      {
        key: 'deals',
        label: 'Deals',
        labelKey: 'name',
        listItems: [
          { key: 'name', label: 'Name' },
          { key: 'amount', label: 'Amount', format: 'number' },
          { key: 'record_url', label: 'Record URL', format: 'url' },
        ],
      },
      { key: 'error', label: 'CRM Error', description: 'Set when no CRM is connected.' },
    ],
  },
];

const meetingFieldsCamel: OutputSchemaField[] = [
  { key: 'recordingId', label: 'Recording ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'meetingTitle', label: 'Calendar Event Title' },
  { key: 'url', label: 'Fathom URL', format: 'url' },
  { key: 'shareUrl', label: 'Share URL', format: 'url' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'scheduledStartTime', label: 'Scheduled Start', format: 'datetime' },
  { key: 'scheduledEndTime', label: 'Scheduled End', format: 'datetime' },
  { key: 'recordingStartTime', label: 'Recording Start', format: 'datetime' },
  { key: 'recordingEndTime', label: 'Recording End', format: 'datetime' },
  { key: 'calendarInviteesDomainsType', label: 'Invitee Domains Type' },
  { key: 'transcriptLanguage', label: 'Transcript Language' },
  {
    key: 'recordedBy',
    label: 'Recorded By',
    children: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'emailDomain', label: 'Email Domain' },
      { key: 'team', label: 'Team' },
    ],
  },
  {
    key: 'calendarInvitees',
    label: 'Calendar Invitees',
    labelKey: 'name',
    listItems: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'emailDomain', label: 'Email Domain' },
      { key: 'isExternal', label: 'External', format: 'boolean' },
      { key: 'matchedSpeakerDisplayName', label: 'Matched Speaker' },
    ],
  },
  {
    key: 'defaultSummary',
    label: 'Summary',
    description: 'Only when Include Summary is on.',
    children: [
      { key: 'templateName', label: 'Template' },
      { key: 'markdownFormatted', label: 'Summary (Markdown)' },
    ],
  },
  {
    key: 'actionItems',
    label: 'Action Items',
    labelKey: 'description',
    description: 'Only when Include Action Items is on.',
    listItems: [
      { key: 'description', label: 'Description' },
      { key: 'completed', label: 'Completed', format: 'boolean' },
      { key: 'userGenerated', label: 'Added by a User', format: 'boolean' },
      { key: 'recordingTimestamp', label: 'Recording Timestamp' },
      { key: 'recordingPlaybackUrl', label: 'Playback URL', format: 'url' },
      {
        key: 'assignee',
        label: 'Assignee',
        children: [
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email', format: 'email' },
          { key: 'team', label: 'Team' },
        ],
      },
    ],
  },
  {
    key: 'transcript',
    label: 'Transcript',
    description: 'Only when Include Transcript is on.',
    listItems: [
      {
        key: 'speaker',
        label: 'Speaker',
        children: [
          { key: 'displayName', label: 'Name' },
          { key: 'matchedCalendarInviteeEmail', label: 'Matched Invitee Email', format: 'email' },
        ],
      },
      { key: 'text', label: 'Text' },
      { key: 'timestamp', label: 'Timestamp (HH:MM:SS)' },
    ],
  },
  {
    key: 'crmMatches',
    label: 'CRM Matches',
    description: 'Only when Include CRM Matches is on.',
    children: [
      { key: 'contacts', label: 'Contacts', labelKey: 'name', listItems: [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email', format: 'email' }, { key: 'recordUrl', label: 'Record URL', format: 'url' }] },
      { key: 'companies', label: 'Companies', labelKey: 'name', listItems: [{ key: 'name', label: 'Name' }, { key: 'recordUrl', label: 'Record URL', format: 'url' }] },
      { key: 'deals', label: 'Deals', labelKey: 'name', listItems: [{ key: 'name', label: 'Name' }, { key: 'amount', label: 'Amount', format: 'number' }, { key: 'recordUrl', label: 'Record URL', format: 'url' }] },
      { key: 'error', label: 'CRM Error' },
    ],
  },
];

const downloadFile: OutputSchemaField[] = [
  { key: 'url', label: 'File URL', format: 'url', description: 'Signed URL; expires about 24 hours after generation.' },
  { key: 'content_type', label: 'Content Type' },
  { key: 'file_size_bytes', label: 'File Size', format: 'filesize' },
  { key: 'expires_at', label: 'Expires At', format: 'datetime' },
];

const download: OutputSchema = {
  fields: [
    { key: 'download_id', label: 'Download ID' },
    { key: 'recording_id', label: 'Recording ID', format: 'number' },
    { key: 'status', label: 'Status', description: 'processing, completed, failed or expired.' },
    { key: 'video', label: 'Video File', description: 'Present once the video is generated.', children: downloadFile },
    { key: 'audio', label: 'Audio File', description: 'Present for audio-only recordings.', children: downloadFile },
    { key: 'failure_reason', label: 'Failure Reason', description: 'generation_failed or generation_timeout.' },
  ],
};

const teamMemberSnake: OutputSchemaField[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'created_at', label: 'Joined At', format: 'datetime' },
];

const accessLevel = ({ key, label }: { key: string; label: string }): OutputSchemaField => ({
  key,
  label,
  children: [
    { key: 'level', label: 'Level' },
    { key: 'teams', label: 'Teams' },
  ],
});

export const fathomOutputSchemas = {
  legacyMeetingPages: {
    itemLabel: 'Page {index}',
    fields: [
      {
        key: 'pages',
        value: '',
        label: 'Pages',
        listItems: [
          {
            key: 'result',
            label: 'Page',
            children: [
              { key: 'items', label: 'Meetings', labelKey: 'title', listItems: meetingFieldsCamel },
              { key: 'nextCursor', label: 'Next Cursor', description: 'Empty on the last page.' },
              { key: 'limit', label: 'Page Size', format: 'number' },
            ],
          },
        ],
      },
    ],
  },
  legacySummary: {
    fields: [
      {
        key: 'summary',
        label: 'Summary',
        children: [
          { key: 'templateName', label: 'Template' },
          { key: 'markdownFormatted', label: 'Summary (Markdown)' },
        ],
      },
      { key: 'destinationUrl', label: 'Destination URL', format: 'url', description: 'Only when a destination URL was given; the summary is then POSTed there.' },
    ],
  },
  legacyTranscript: {
    fields: [
      {
        key: 'transcript',
        label: 'Transcript',
        listItems: [
          {
            key: 'speaker',
            label: 'Speaker',
            children: [
              { key: 'displayName', label: 'Name' },
              { key: 'matchedCalendarInviteeEmail', label: 'Matched Invitee Email', format: 'email' },
            ],
          },
          { key: 'text', label: 'Text' },
          { key: 'timestamp', label: 'Timestamp (HH:MM:SS)' },
        ],
      },
      { key: 'destinationUrl', label: 'Destination URL', format: 'url', description: 'Only when a destination URL was given; the transcript is then POSTed there.' },
    ],
  },
  legacyTeams: {
    fields: [
      {
        key: 'result',
        label: 'Result',
        children: [
          { key: 'items', label: 'Teams', labelKey: 'name', listItems: [{ key: 'name', label: 'Name' }, { key: 'createdAt', label: 'Created At', format: 'datetime' }] },
          { key: 'nextCursor', label: 'Next Cursor' },
          { key: 'limit', label: 'Page Size', format: 'number' },
        ],
      },
    ],
  },
  legacyTeamMembers: {
    fields: [
      {
        key: 'result',
        label: 'Result',
        children: [
          {
            key: 'items',
            label: 'Members',
            labelKey: 'name',
            listItems: [
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email', format: 'email' },
              { key: 'createdAt', label: 'Joined At', format: 'datetime' },
            ],
          },
          { key: 'nextCursor', label: 'Next Cursor' },
          { key: 'limit', label: 'Page Size', format: 'number' },
        ],
      },
    ],
  },
  meetingsPage: {
    fields: [
      { key: 'items', label: 'Meetings', labelKey: 'title', listItems: meetingFieldsSnake },
      { key: 'next_cursor', label: 'Next Cursor', description: 'Pass to the next call to continue; empty on the last page.' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
    ],
  },
  recordingSummary: {
    fields: [
      { key: 'recording_id', label: 'Recording ID', format: 'number' },
      { key: 'summary', label: 'Summary', children: summarySnake },
    ],
  },
  recordingTranscript: {
    fields: [
      { key: 'recording_id', label: 'Recording ID', format: 'number' },
      { key: 'transcript', label: 'Transcript', listItems: transcriptSnake },
    ],
  },
  meetingTypes: {
    fields: [
      {
        key: 'items',
        label: 'Meeting Types',
        labelKey: 'name',
        listItems: [
          { key: 'name', label: 'Name' },
          { key: 'status', label: 'Status', description: 'active or inactive.' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  users: {
    fields: [
      {
        key: 'items',
        label: 'Users',
        labelKey: 'email',
        listItems: [
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email', format: 'email' },
          { key: 'status', label: 'Status', description: 'active, deactivated or invited.' },
          { key: 'created_at', label: 'Created At', format: 'datetime', description: 'For invited users, the invite date.' },
          {
            key: 'permissions',
            label: 'Permissions',
            description: 'Missing for invited users.',
            children: [accessLevel({ key: 'settings_access', label: 'Settings Access' }), accessLevel({ key: 'view_access', label: 'View Access' })],
          },
        ],
      },
      { key: 'next_cursor', label: 'Next Cursor' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
    ],
  },
  teamMemberLookup: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'member', label: 'Member', description: 'Empty when no member has this email.', children: teamMemberSnake },
    ],
  },
  download,
  newRecording: { fields: meetingFieldsSnake },
} satisfies Record<string, OutputSchema>;
