import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const meetingSettingsFields: OutputSchemaField[] = [
  { key: 'host_video', label: 'Host Video On', format: 'boolean' },
  { key: 'participant_video', label: 'Participant Video On', format: 'boolean' },
  { key: 'join_before_host', label: 'Join Before Host', format: 'boolean' },
  { key: 'mute_upon_entry', label: 'Mute Upon Entry', format: 'boolean' },
  { key: 'waiting_room', label: 'Waiting Room', format: 'boolean' },
  { key: 'meeting_authentication', label: 'Sign-in Required', format: 'boolean' },
  { key: 'auto_recording', label: 'Auto Recording', description: 'local, cloud or none.' },
  { key: 'audio', label: 'Audio', description: 'both, telephony, voip or thirdParty.' },
  { key: 'approval_type', label: 'Registration Approval Type', format: 'number', description: '0 automatic, 1 manual, 2 no registration required.' },
  { key: 'alternative_hosts', label: 'Alternative Hosts' },
];

const occurrenceFields: OutputSchemaField[] = [
  { key: 'occurrence_id', label: 'Occurrence ID' },
  { key: 'start_time', label: 'Start Time', format: 'datetime' },
  { key: 'duration', label: 'Duration (minutes)', format: 'number' },
  { key: 'status', label: 'Status' },
];

const meetingFields: OutputSchemaField[] = [
  { key: 'id', label: 'Meeting ID', format: 'number' },
  { key: 'uuid', label: 'Meeting UUID' },
  { key: 'topic', label: 'Topic' },
  { key: 'type', label: 'Type', format: 'number', description: '1 instant, 2 scheduled, 3 recurring without fixed time, 8 recurring with fixed time.' },
  { key: 'status', label: 'Status' },
  { key: 'start_time', label: 'Start Time', format: 'datetime' },
  { key: 'duration', label: 'Duration (minutes)', format: 'number' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'join_url', label: 'Join URL', format: 'url' },
  { key: 'registration_url', label: 'Registration URL', format: 'url', description: 'Only when registration is on (paid plan).' },
  { key: 'password', label: 'Passcode' },
  { key: 'host_id', label: 'Host ID' },
  { key: 'host_email', label: 'Host Email', format: 'email' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'pre_schedule', label: 'Pre-scheduled', format: 'boolean' },
  { key: 'occurrences', label: 'Occurrences', labelKey: 'start_time', description: 'Only for recurring meetings.', listItems: occurrenceFields },
  { key: 'settings', label: 'Settings', children: meetingSettingsFields },
];

const meetingListItemFields: OutputSchemaField[] = [
  { key: 'id', label: 'Meeting ID', format: 'number' },
  { key: 'uuid', label: 'Meeting UUID' },
  { key: 'topic', label: 'Topic' },
  { key: 'type', label: 'Type', format: 'number' },
  { key: 'start_time', label: 'Start Time', format: 'datetime' },
  { key: 'duration', label: 'Duration (minutes)', format: 'number' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'join_url', label: 'Join URL', format: 'url' },
  { key: 'host_id', label: 'Host ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const pagingFields: OutputSchemaField[] = [
  { key: 'next_page_token', label: 'Next Page Token', description: 'Pass this to the next run to get the next page. Empty when there are no more pages.' },
  { key: 'has_more', label: 'Has More Pages', format: 'boolean' },
  { key: 'page_size', label: 'Page Size', format: 'number' },
  { key: 'total_records', label: 'Total Records (all pages)', format: 'number' },
];

const recordingFileFields: OutputSchemaField[] = [
  { key: 'id', label: 'File ID' },
  { key: 'recording_type', label: 'Recording Type', description: 'For example shared_screen_with_speaker_view, audio_only, chat_file or audio_transcript.' },
  { key: 'file_type', label: 'File Type', description: 'MP4, M4A, CHAT, TRANSCRIPT, CC, CSV, TIMELINE or SUMMARY.' },
  { key: 'file_extension', label: 'File Extension' },
  { key: 'file_size', label: 'File Size', format: 'filesize' },
  { key: 'recording_start', label: 'Recording Start', format: 'datetime' },
  { key: 'recording_end', label: 'Recording End', format: 'datetime' },
  { key: 'play_url', label: 'Play URL', format: 'url' },
  { key: 'download_url', label: 'Download URL', format: 'url', description: 'Needs a Zoom access token or the recording passcode to download.' },
  { key: 'status', label: 'Status' },
];

const recordingMeetingFields: OutputSchemaField[] = [
  { key: 'id', label: 'Meeting ID', format: 'number' },
  { key: 'uuid', label: 'Meeting UUID' },
  { key: 'topic', label: 'Topic' },
  { key: 'start_time', label: 'Start Time', format: 'datetime' },
  { key: 'duration', label: 'Duration (minutes)', format: 'number' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'total_size', label: 'Total Size', format: 'filesize' },
  { key: 'recording_count', label: 'Recording Count', format: 'number' },
  { key: 'share_url', label: 'Share URL', format: 'url' },
  { key: 'host_id', label: 'Host ID' },
  { key: 'recording_files', label: 'Recording Files', labelKey: 'recording_type', listItems: recordingFileFields },
];

export const createMeetingOutputSchema: OutputSchema = {
  fields: meetingFields,
};

export const getMeetingOutputSchema: OutputSchema = {
  fields: meetingFields,
};

export const updateMeetingOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'meeting_id', label: 'Meeting ID' },
    { key: 'message', label: 'Message' },
  ],
};

export const updateMeetingByIdOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'meeting_id', label: 'Meeting ID' },
    { key: 'occurrence_id', label: 'Occurrence ID' },
    { key: 'updated_fields', label: 'Updated Fields' },
  ],
};

export const listMeetingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'meetings', label: 'Meetings', labelKey: 'topic', listItems: meetingListItemFields },
    ...pagingFields,
  ],
};

export const deleteMeetingOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'meeting_id', label: 'Meeting ID' },
    { key: 'occurrence_id', label: 'Occurrence ID' },
  ],
};

export const getCurrentUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'User ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'type', label: 'Plan Type', format: 'number', description: '1 Basic (free), 2 Licensed, 4 Unassigned without Meetings Basic, 99 None.' },
    { key: 'timezone', label: 'Timezone' },
    { key: 'pmi', label: 'Personal Meeting ID', format: 'number' },
    { key: 'personal_meeting_url', label: 'Personal Meeting URL', format: 'url' },
    { key: 'language', label: 'Language' },
    { key: 'status', label: 'Status' },
    { key: 'role_name', label: 'Role' },
    { key: 'account_id', label: 'Account ID' },
    { key: 'pic_url', label: 'Picture', format: 'image' },
    { key: 'user_created_at', label: 'Created At', format: 'datetime' },
    { key: 'last_login_time', label: 'Last Login', format: 'datetime' },
  ],
};

export const createRegistrantOutputSchema: OutputSchema = {
  fields: [
    { key: 'registrant_id', label: 'Registrant ID' },
    { key: 'id', label: 'Meeting ID', format: 'number' },
    { key: 'topic', label: 'Topic' },
    { key: 'start_time', label: 'Start Time', format: 'datetime' },
    { key: 'join_url', label: 'Personal Join URL', format: 'url' },
    { key: 'participant_pin_code', label: 'Participant PIN Code', format: 'number' },
    { key: 'occurrences', label: 'Occurrences', labelKey: 'start_time', listItems: occurrenceFields },
  ],
};

export const listPastMeetingInstancesOutputSchema: OutputSchema = {
  fields: [
    { key: 'meeting_id', label: 'Meeting ID' },
    {
      key: 'meetings',
      label: 'Instances',
      labelKey: 'start_time',
      listItems: [
        { key: 'uuid', label: 'Instance UUID' },
        { key: 'start_time', label: 'Start Time', format: 'datetime' },
      ],
    },
  ],
};

export const listRecordingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'from', label: 'From', format: 'date' },
    { key: 'to', label: 'To', format: 'date' },
    { key: 'meetings', label: 'Recorded Meetings', labelKey: 'topic', listItems: recordingMeetingFields },
    ...pagingFields,
  ],
};
