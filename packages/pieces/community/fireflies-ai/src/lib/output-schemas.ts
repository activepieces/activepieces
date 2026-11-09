import { OutputSchema } from '@activepieces/pieces-framework';

const speakerFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Speaker ID' },
  { key: 'name', label: 'Name' },
];

const attendeeFields: OutputSchema['fields'] = [
  { key: 'displayName', label: 'Display Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phoneNumber', label: 'Phone Number' },
  { key: 'name', label: 'Name' },
  { key: 'location', label: 'Location' },
];

const meetingInfoFields: OutputSchema['fields'] = [
  { key: 'fred_joined', label: 'Fred Joined', format: 'boolean' },
  { key: 'silent_meeting', label: 'Silent Meeting', format: 'boolean' },
  { key: 'summary_status', label: 'Summary Status', description: 'processing, processed, failed, skipped or default' },
];

const legacySummaryFields: OutputSchema['fields'] = [
  { key: 'keywords', label: 'Keywords' },
  { key: 'action_items', label: 'Action Items' },
  { key: 'outline', label: 'Outline' },
  { key: 'shorthand_bullet', label: 'Shorthand Bullets' },
  { key: 'overview', label: 'Overview' },
  { key: 'bullet_gist', label: 'Bullet Gist' },
  { key: 'gist', label: 'Gist' },
  { key: 'short_summary', label: 'Short Summary' },
  { key: 'short_overview', label: 'Short Overview' },
  { key: 'meeting_type', label: 'Meeting Type' },
  { key: 'topics_discussed', label: 'Topics Discussed' },
  { key: 'transcript_chapters', label: 'Transcript Chapters' },
];

const meetingOwnerFields: OutputSchema['fields'] = [
  { key: 'user_id', label: 'User ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'name', label: 'Name' },
  { key: 'num_transcripts', label: 'Number of Transcripts', format: 'number' },
  { key: 'recent_meeting', label: 'Recent Meeting ID' },
  { key: 'minutes_consumed', label: 'Minutes Consumed', format: 'number' },
  { key: 'is_admin', label: 'Is Admin', format: 'boolean' },
  { key: 'integrations', label: 'Integrations' },
];

const meetingFullFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Meeting ID' },
  { key: 'title', label: 'Title' },
  { key: 'dateString', label: 'Date', format: 'datetime' },
  { key: 'date', label: 'Date (Epoch ms)', format: 'datetime' },
  { key: 'duration', label: 'Duration (Minutes)', format: 'number' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'organizer_email', label: 'Organizer Email', format: 'email' },
  { key: 'host_email', label: 'Host Email', format: 'email' },
  { key: 'transcript_url', label: 'Transcript URL', format: 'url' },
  { key: 'audio_url', label: 'Audio URL', format: 'url', description: 'Pro plan and above; expires after 24 hours' },
  { key: 'video_url', label: 'Video URL', format: 'url', description: 'Pro plan and above; expires after 24 hours' },
  { key: 'meeting_link', label: 'Meeting Link', format: 'url' },
  { key: 'calendar_id', label: 'Calendar Event ID' },
  { key: 'cal_id', label: 'Calendar ID' },
  { key: 'calendar_type', label: 'Calendar Type' },
  { key: 'participants', label: 'Participants' },
  { key: 'fireflies_users', label: 'Fireflies Users' },
  { key: 'speakers', label: 'Speakers', labelKey: 'name', listItems: speakerFields },
  { key: 'meeting_attendees', label: 'Meeting Attendees', labelKey: 'email', listItems: attendeeFields },
  { key: 'user', label: 'Owner', children: meetingOwnerFields },
  { key: 'summary', label: 'Summary', children: legacySummaryFields },
  { key: 'meeting_info', label: 'Meeting Info', children: meetingInfoFields },
];

const meetingSlimFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Meeting ID' },
  { key: 'title', label: 'Title' },
  { key: 'dateString', label: 'Date', format: 'datetime' },
  { key: 'date', label: 'Date (Epoch ms)', format: 'datetime' },
  { key: 'duration', label: 'Duration (Minutes)', format: 'number' },
  { key: 'organizer_email', label: 'Organizer Email', format: 'email' },
  { key: 'participants', label: 'Participants' },
  { key: 'transcript_url', label: 'Transcript URL', format: 'url' },
  { key: 'meeting_link', label: 'Meeting Link', format: 'url' },
  { key: 'summary', label: 'Summary', children: [{ key: 'short_summary', label: 'Short Summary' }] },
  { key: 'meeting_info', label: 'Meeting Info', children: [{ key: 'summary_status', label: 'Summary Status' }] },
];

const userFields: OutputSchema['fields'] = [
  { key: 'user_id', label: 'User ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'name', label: 'Name' },
  { key: 'num_transcripts', label: 'Number of Transcripts', format: 'number' },
  { key: 'recent_transcript', label: 'Recent Transcript ID' },
  { key: 'recent_meeting', label: 'Recent Meeting ID' },
  { key: 'minutes_consumed', label: 'Minutes Consumed', format: 'number' },
  { key: 'is_admin', label: 'Is Admin', format: 'boolean' },
  { key: 'integrations', label: 'Integrations' },
];

const userDetailFields: OutputSchema['fields'] = [
  ...userFields,
  { key: 'is_calendar_in_sync', label: 'Calendar In Sync', format: 'boolean' },
  {
    key: 'user_groups',
    label: 'User Groups',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Group ID' },
      { key: 'name', label: 'Name' },
      { key: 'handle', label: 'Handle' },
    ],
  },
];

export const firefliesOutputSchemas = {
  findMeetingById: { fields: meetingFullFields },
  findRecentMeeting: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'meeting', label: 'Meeting', children: meetingFullFields },
    ],
  },
  findMeetingByQuery: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'meetings', label: 'Meetings', labelKey: 'title', listItems: meetingFullFields },
    ],
  },
  uploadAudio: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'title', label: 'Title' },
      { key: 'message', label: 'Message' },
    ],
  },
  getUserDetails: { fields: userDetailFields },
  searchMeetings: {
    fields: [
      { key: 'meetings', label: 'Meetings', labelKey: 'title', listItems: meetingSlimFields },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'limit', label: 'Limit', format: 'number' },
      { key: 'skip', label: 'Skip', format: 'number' },
      { key: 'next_skip', label: 'Next Skip', format: 'number', description: 'Pass as skip to get the next page; null when there are no more results' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
    ],
  },
  getMeeting: {
    fields: [
      { key: 'id', label: 'Meeting ID' },
      { key: 'title', label: 'Title' },
      { key: 'dateString', label: 'Date', format: 'datetime' },
      { key: 'date', label: 'Date (Epoch ms)', format: 'datetime' },
      { key: 'duration', label: 'Duration (Minutes)', format: 'number' },
      { key: 'privacy', label: 'Privacy' },
      { key: 'organizer_email', label: 'Organizer Email', format: 'email' },
      { key: 'transcript_url', label: 'Transcript URL', format: 'url' },
      { key: 'meeting_link', label: 'Meeting Link', format: 'url' },
      { key: 'calendar_id', label: 'Calendar Event ID' },
      { key: 'cal_id', label: 'Calendar ID' },
      { key: 'calendar_type', label: 'Calendar Type' },
      { key: 'participants', label: 'Participants' },
      { key: 'fireflies_users', label: 'Fireflies Users' },
      { key: 'workspace_users', label: 'Workspace Users' },
      { key: 'speakers', label: 'Speakers', labelKey: 'name', listItems: speakerFields },
      { key: 'meeting_attendees', label: 'Meeting Attendees', labelKey: 'email', listItems: attendeeFields },
      {
        key: 'meeting_attendance',
        label: 'Meeting Attendance',
        labelKey: 'name',
        listItems: [
          { key: 'name', label: 'Name' },
          { key: 'join_time', label: 'Join Time', format: 'datetime' },
          { key: 'leave_time', label: 'Leave Time', format: 'datetime' },
        ],
      },
      {
        key: 'channels',
        label: 'Channels',
        labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Channel ID' },
          { key: 'title', label: 'Title' },
        ],
      },
      { key: 'meeting_info', label: 'Meeting Info', children: meetingInfoFields },
    ],
  },
  getMeetingSummary: {
    fields: [
      { key: 'id', label: 'Meeting ID' },
      { key: 'title', label: 'Title' },
      { key: 'dateString', label: 'Date', format: 'datetime' },
      { key: 'summary_status', label: 'Summary Status', description: 'processing, processed, failed, skipped or default' },
      {
        key: 'summary',
        label: 'Summary',
        children: [
          ...legacySummaryFields,
          { key: 'notes', label: 'Notes' },
          {
            key: 'extended_sections',
            label: 'Extended Sections',
            labelKey: 'title',
            listItems: [
              { key: 'title', label: 'Title' },
              { key: 'content', label: 'Content' },
            ],
          },
        ],
      },
    ],
  },
  getMeetingTranscript: {
    fields: [
      { key: 'id', label: 'Meeting ID' },
      { key: 'title', label: 'Title' },
      { key: 'dateString', label: 'Date', format: 'datetime' },
      { key: 'speakers', label: 'Speakers', labelKey: 'name', listItems: speakerFields },
      { key: 'total_sentences', label: 'Total Sentences', format: 'number' },
      { key: 'offset', label: 'Offset', format: 'number' },
      { key: 'returned', label: 'Returned', format: 'number' },
      { key: 'next_offset', label: 'Next Offset', format: 'number', description: 'Pass as offset to read the next sentences; null at the end' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
      {
        key: 'sentences',
        label: 'Sentences',
        labelKey: 'text',
        listItems: [
          { key: 'index', label: 'Index', format: 'number' },
          { key: 'speaker_name', label: 'Speaker Name' },
          { key: 'speaker_id', label: 'Speaker ID' },
          { key: 'text', label: 'Text' },
          { key: 'start_time', label: 'Start Time (Seconds)', format: 'number' },
          { key: 'end_time', label: 'End Time (Seconds)', format: 'number' },
        ],
      },
    ],
  },
  getCurrentUser: { fields: userDetailFields },
  listUsers: {
    fields: [
      { key: 'users', label: 'Users', labelKey: 'email', listItems: userFields },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  listChannels: {
    fields: [
      {
        key: 'channels',
        label: 'Channels',
        labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Channel ID' },
          { key: 'title', label: 'Title' },
          { key: 'is_private', label: 'Private', format: 'boolean' },
          { key: 'created_by', label: 'Created By' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
          { key: 'updated_at', label: 'Updated At', format: 'datetime' },
          {
            key: 'members',
            label: 'Members',
            labelKey: 'email',
            listItems: [
              { key: 'user_id', label: 'User ID' },
              { key: 'email', label: 'Email', format: 'email' },
              { key: 'name', label: 'Name' },
            ],
          },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  listContacts: {
    fields: [
      {
        key: 'contacts',
        label: 'Contacts',
        labelKey: 'email',
        listItems: [
          { key: 'email', label: 'Email', format: 'email' },
          { key: 'name', label: 'Name' },
          { key: 'picture', label: 'Picture', format: 'image' },
          { key: 'last_meeting_date', label: 'Last Meeting Date', format: 'datetime' },
        ],
      },
      { key: 'total', label: 'Total', format: 'number' },
      { key: 'offset', label: 'Offset', format: 'number' },
      { key: 'returned', label: 'Returned', format: 'number' },
      { key: 'next_offset', label: 'Next Offset', format: 'number' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
    ],
  },
  moveMeetingsToChannel: {
    fields: [
      { key: 'channel_id', label: 'Channel ID' },
      {
        key: 'meetings',
        label: 'Meetings',
        labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Meeting ID' },
          { key: 'title', label: 'Title' },
          { key: 'channels', label: 'Channels', listItems: [{ key: 'id', label: 'Channel ID' }] },
        ],
      },
    ],
  },
  updateMeetingTitle: {
    fields: [
      { key: 'id', label: 'Meeting ID' },
      { key: 'title', label: 'Title' },
    ],
  },
  updateMeetingPrivacy: {
    fields: [
      { key: 'id', label: 'Meeting ID' },
      { key: 'title', label: 'Title' },
      { key: 'privacy', label: 'Privacy' },
    ],
  },
  shareMeeting: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'message', label: 'Message' },
      { key: 'share_slug', label: 'Share Slug' },
      { key: 'meeting_id', label: 'Meeting ID' },
      { key: 'emails', label: 'Emails' },
    ],
  },
  revokeMeetingAccess: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'message', label: 'Message' },
      { key: 'meeting_id', label: 'Meeting ID' },
      { key: 'email', label: 'Email', format: 'email' },
    ],
  },
  deleteMeeting: {
    fields: [
      { key: 'id', label: 'Meeting ID' },
      { key: 'title', label: 'Title' },
      { key: 'dateString', label: 'Date', format: 'datetime' },
      { key: 'date', label: 'Date (Epoch ms)', format: 'datetime' },
      { key: 'duration', label: 'Duration (Minutes)', format: 'number' },
      { key: 'organizer_email', label: 'Organizer Email', format: 'email' },
    ],
  },
  askFred: {
    fields: [
      { key: 'id', label: 'Message ID' },
      { key: 'thread_id', label: 'Thread ID' },
      { key: 'query', label: 'Question' },
      { key: 'answer', label: 'Answer' },
      { key: 'suggested_queries', label: 'Suggested Questions' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
    ],
  },
  createSoundbite: {
    fields: [
      { key: 'id', label: 'Soundbite ID' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status', description: 'Starts as pending while Fireflies renders the clip' },
      { key: 'summary', label: 'Summary' },
    ],
  },
  addBotToLiveMeeting: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'meeting_link', label: 'Meeting Link', format: 'url' },
    ],
  },
  newTranscriptionCompleted: { fields: meetingFullFields },
  meetingSummarized: { fields: meetingFullFields },
  customApiCall: {
    fields: [
      { key: 'status', label: 'Status Code', format: 'number' },
      { key: 'headers', label: 'Headers', dynamicKey: true },
      { key: 'body', label: 'Body' },
    ],
  },
} satisfies Record<string, OutputSchema>;
