const MEETING_FULL_FIELDS = `
  id
  dateString
  privacy
  speakers {
    id
    name
  }
  title
  host_email
  organizer_email
  calendar_id
  user {
    user_id
    email
    name
    num_transcripts
    recent_meeting
    minutes_consumed
    is_admin
    integrations
  }
  fireflies_users
  participants
  date
  transcript_url
  audio_url
  video_url
  duration
  meeting_attendees {
    displayName
    email
    phoneNumber
    name
    location
  }
  summary {
    keywords
    action_items
    outline
    shorthand_bullet
    overview
    bullet_gist
    gist
    short_summary
    short_overview
    meeting_type
    topics_discussed
    transcript_chapters
  }
  cal_id
  calendar_type
  meeting_info {
    fred_joined
    silent_meeting
    summary_status
  }
  meeting_link
`;

const MEETING_SLIM_FIELDS = `
  id
  title
  date
  dateString
  duration
  organizer_email
  participants
  transcript_url
  meeting_link
  summary {
    short_summary
  }
  meeting_info {
    summary_status
  }
`;

const MEETING_METADATA_FIELDS = `
  id
  title
  date
  dateString
  duration
  privacy
  organizer_email
  transcript_url
  meeting_link
  calendar_id
  cal_id
  calendar_type
  participants
  fireflies_users
  workspace_users
  speakers {
    id
    name
  }
  meeting_attendees {
    displayName
    email
    phoneNumber
    name
    location
  }
  meeting_attendance {
    name
    join_time
    leave_time
  }
  channels {
    id
    title
  }
  meeting_info {
    fred_joined
    silent_meeting
    summary_status
  }
`;

const USER_FIELDS = `
  user_id
  email
  name
  num_transcripts
  recent_transcript
  recent_meeting
  minutes_consumed
  is_admin
  integrations
  is_calendar_in_sync
  user_groups {
    id
    name
    handle
  }
`;

const getTranscript = `
query Transcript($transcriptId: String!) {
  transcript(id: $transcriptId) {
    ${MEETING_FULL_FIELDS}
  }
}`;

const latestTranscripts = `
query LatestTranscripts($limit: Int!, $skip: Int!) {
  transcripts(limit: $limit, skip: $skip) {
    ${MEETING_FULL_FIELDS}
  }
}`;

const getUser = `
query User($userId: String!) {
  user(id: $userId) {
    ${USER_FIELDS}
  }
}`;

const currentUser = `
query CurrentUser {
  user {
    ${USER_FIELDS}
  }
}`;

const validateUser = `
query ValidateUser {
  user {
    user_id
    email
  }
}`;

const getMeeting = `
query Meeting($transcriptId: String!) {
  transcript(id: $transcriptId) {
    ${MEETING_METADATA_FIELDS}
  }
}`;

const getMeetingSummary = `
query MeetingSummary($transcriptId: String!) {
  transcript(id: $transcriptId) {
    id
    title
    dateString
    meeting_info {
      summary_status
    }
    summary {
      action_items
      keywords
      outline
      overview
      shorthand_bullet
      notes
      gist
      bullet_gist
      short_summary
      short_overview
      meeting_type
      topics_discussed
      transcript_chapters
      extended_sections {
        title
        content
      }
    }
  }
}`;

const getMeetingTranscript = `
query MeetingTranscript($transcriptId: String!) {
  transcript(id: $transcriptId) {
    id
    title
    dateString
    speakers {
      id
      name
    }
    sentences {
      index
      speaker_name
      speaker_id
      text
      start_time
      end_time
    }
  }
}`;

const listUsers = `
query Users {
  users {
    user_id
    email
    name
    num_transcripts
    recent_transcript
    recent_meeting
    minutes_consumed
    is_admin
    integrations
  }
}`;

const listChannels = `
query Channels {
  channels {
    id
    title
    is_private
    created_by
    created_at
    updated_at
    members {
      user_id
      email
      name
    }
  }
}`;

const listContacts = `
query Contacts {
  contacts {
    email
    name
    picture
    last_meeting_date
  }
}`;

const uploadAudio = `
mutation UploadAudio($input: AudioUploadInput) {
  uploadAudio(input: $input) {
    success
    title
    message
  }
}`;

const updateMeetingTitle = `
mutation UpdateMeetingTitle($id: String!, $title: String!) {
  updateMeetingTitle(input: { id: $id, title: $title }) {
    title
  }
}`;

const updateMeetingChannel = `
mutation UpdateMeetingChannel($transcriptIds: [String!]!, $channelId: ID!) {
  updateMeetingChannel(input: { transcript_ids: $transcriptIds, channel_id: $channelId }) {
    id
    title
    channels {
      id
    }
  }
}`;

const getChannel = `
query Channel($channelId: ID!) {
  channel(id: $channelId) {
    id
    title
  }
}`;

const revokeSharedMeetingAccess = `
mutation RevokeSharedMeetingAccess($meetingId: ID!, $email: String!) {
  revokeSharedMeetingAccess(input: { meeting_id: $meetingId, email: $email }) {
    success
    message
  }
}`;

const deleteTranscript = `
mutation DeleteTranscript($transcriptId: String!) {
  deleteTranscript(id: $transcriptId) {
    id
    title
    date
    dateString
    duration
    organizer_email
  }
}`;

function addToLiveMeeting({ variables }: { variables: GraphqlVariableSpec[] }): string {
  return `
mutation AddToLiveMeeting(${variables.map((spec) => `$${spec.variable}: ${spec.type}`).join(', ')}) {
  addToLiveMeeting(${variables.map((spec) => `${spec.argument}: $${spec.variable}`).join(', ')}) {
    success
  }
}`;
}

function updateMeetingPrivacy({ privacy }: { privacy: string }): string {
  return `
mutation UpdateMeetingPrivacy($id: ID!) {
  updateMeetingPrivacy(input: { id: $id, privacy: ${privacy} }) {
    id
    title
    privacy
  }
}`;
}

function shareMeeting({ withExpiry }: { withExpiry: boolean }): string {
  const expiryVariable = withExpiry ? ', $expiryDays: Int!' : '';
  const expiryField = withExpiry ? ', expiry_days: $expiryDays' : '';
  return `
mutation ShareMeeting($meetingId: ID!, $emails: [String!]!${expiryVariable}) {
  shareMeeting(input: { meeting_id: $meetingId, emails: $emails${expiryField} }) {
    success
    message
    share_slug
  }
}`;
}

function createBite({ privacies, variables }: { privacies: string[]; variables: GraphqlVariableSpec[] }): string {
  const privacyArg = privacies.length > 0 ? `, privacies: [${privacies.join(', ')}]` : '';
  return `
mutation CreateBite(${variables.map((spec) => `$${spec.variable}: ${spec.type}`).join(', ')}) {
  createBite(${variables.map((spec) => `${spec.argument}: $${spec.variable}`).join(', ')}${privacyArg}) {
    id
    name
    status
    summary
  }
}`;
}

function createAskFredThread({ inputFields, filterFields, variables }: { inputFields: GraphqlVariableSpec[]; filterFields: GraphqlVariableSpec[]; variables: GraphqlVariableSpec[] }): string {
  const filters = filterFields.length > 0 ? `, filters: { ${filterFields.map((spec) => `${spec.argument}: $${spec.variable}`).join(', ')} }` : '';
  return `
mutation CreateAskFredThread(${variables.map((spec) => `$${spec.variable}: ${spec.type}`).join(', ')}) {
  createAskFredThread(input: { ${inputFields.map((spec) => `${spec.argument}: $${spec.variable}`).join(', ')}${filters}, generate_suggestions: false }) {
    message {
      id
      thread_id
      query
      answer
      suggested_queries
      status
      created_at
    }
  }
}`;
}

function searchTranscripts({ variables, scope, fields }: { variables: GraphqlVariableSpec[]; scope: string | undefined; fields: 'full' | 'slim' }): string {
  const declared = variables.map((spec) => `$${spec.variable}: ${spec.type}`).join(', ');
  const args = [...variables.map((spec) => `${spec.argument}: $${spec.variable}`), ...(scope ? [`scope: ${JSON.stringify(scope)}`] : [])].join(', ');
  return `
query SearchTranscripts(${declared}) {
  transcripts(${args}) {
    ${fields === 'full' ? MEETING_FULL_FIELDS : MEETING_SLIM_FIELDS}
  }
}`;
}

export const firefliesQueries = {
  getTranscript,
  latestTranscripts,
  getUser,
  currentUser,
  validateUser,
  getMeeting,
  getMeetingSummary,
  getMeetingTranscript,
  listUsers,
  listChannels,
  listContacts,
  uploadAudio,
  updateMeetingTitle,
  updateMeetingChannel,
  getChannel,
  revokeSharedMeetingAccess,
  deleteTranscript,
  addToLiveMeeting,
  updateMeetingPrivacy,
  shareMeeting,
  createBite,
  createAskFredThread,
  searchTranscripts,
};

export type GraphqlVariableSpec = {
  variable: string;
  argument: string;
  type: string;
};
