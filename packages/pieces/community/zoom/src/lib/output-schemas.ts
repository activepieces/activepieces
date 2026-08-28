import type { OutputSchema } from '@activepieces/pieces-framework';

/**
 * Output schemas for the Zoom piece.
 *
 * Shape source: a live `POST /v2/users/me/meetings` 201 body and the
 * `GET /v2/meetings/{meetingId}` 200 body for the same meeting, captured through a
 * Server-to-Server OAuth app and diffed against each other. Not authored from docs.
 *
 * `find-meeting` and `create-meeting` return the same meeting resource, so the field
 * set lives in one shared const and each action exports its own schema over it. The
 * captured diff was: the create body adds `authentication_option`,
 * `authentication_name` and `authentication_domains` under `settings`, and the find
 * body adds `assistant_id` — all four are fields this curation drops anyway, so no
 * described path is absent from either response.
 *
 * Curation policy: an outputSchema is a curated tree, so an omitted field is a hidden
 * field. Kept is what a downstream step would branch on, template into a message, or
 * pass to another action. Dropped is transport noise and duplicated credential
 * material. Every `children` path is relative to its parent, never dotted from root.
 *
 * Deliberately not described, because they were not in the captured payloads and the
 * schema skill forbids guessing a shape: `registration_url` (registration-enabled
 * meetings only) and `occurrences` (recurring meetings only). Both are declared
 * optional on `MeetingResponseBody` and can be added from a capture of those cases.
 */

/**
 * The meeting resource, shared by Find and Create.
 *
 * Deliberately NOT included: `h323_password`, `pstn_password` and
 * `encrypted_password` — encoded restatements of `password` for dial-in and URL
 * embedding. Three near-duplicate secrets in the data selector is noise; the one
 * canonical passcode is kept.
 */
const meetingFields: OutputSchema['fields'] = [
  // --- Identity ---
  {
    key: 'id',
    label: 'Meeting ID',
    format: 'number',
    description: 'Numeric meeting ID. Use this to look up, update, or delete the meeting.',
  },
  {
    key: 'uuid',
    label: 'Meeting UUID',
    description:
      'Unique identifier for this meeting *instance*. A recurring meeting keeps one ID but gets a new UUID per occurrence.',
  },

  // --- Content ---
  { key: 'topic', label: 'Topic' },
  { key: 'agenda', label: 'Agenda' },

  // --- Schedule ---
  {
    key: 'type',
    label: 'Meeting Type',
    format: 'number',
    description: '1 = instant, 2 = scheduled, 3 = recurring (no fixed time), 8 = recurring (fixed time).',
  },
  {
    key: 'status',
    label: 'Status',
    description: 'Either `waiting` (not yet started) or `started`.',
  },
  { key: 'start_time', label: 'Start Time', format: 'datetime' },
  {
    key: 'duration',
    label: 'Duration (Minutes)',
    // Zoom returns whole minutes. The `duration` format renders elapsed time and would
    // mis-scale an integer minute count, so this stays a labelled number.
    format: 'number',
  },
  {
    key: 'timezone',
    label: 'Timezone',
    description: 'IANA timezone the start time is expressed in, e.g. `Asia/Amman`.',
  },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  {
    key: 'pre_schedule',
    label: 'Pre-Scheduled',
    format: 'boolean',
    description: 'True when the meeting was created as a pre-scheduled placeholder with no fixed time yet.',
  },

  // --- Access ---
  {
    key: 'join_url',
    label: 'Join URL',
    format: 'url',
    description: 'Participant join link. This is the one to send to attendees.',
  },
  {
    key: 'start_url',
    label: 'Start URL',
    format: 'url',
    description:
      'Host start link. Embeds a ZAK token that grants host rights and expires — treat it as a secret and never send it to participants.',
  },
  {
    key: 'password',
    label: 'Passcode',
    description: 'Meeting passcode required to join when a passcode is enabled.',
  },

  // --- Host ---
  { key: 'host_id', label: 'Host ID' },
  { key: 'host_email', label: 'Host Email', format: 'email' },

  // --- Settings ---
  {
    // `settings` carries 21 keys. Naming it without `children` would make the renderer
    // drill all 21 generically — worse than omitting it. So it is described explicitly
    // and narrowed to the 10 settings a flow would realistically read back.
    key: 'settings',
    label: 'Settings',
    children: [
      { key: 'host_video', label: 'Host Video On Join', format: 'boolean' },
      { key: 'participant_video', label: 'Participant Video On Join', format: 'boolean' },
      { key: 'join_before_host', label: 'Join Before Host', format: 'boolean' },
      { key: 'waiting_room', label: 'Waiting Room Enabled', format: 'boolean' },
      { key: 'mute_upon_entry', label: 'Mute On Entry', format: 'boolean' },
      {
        key: 'approval_type',
        label: 'Registration Approval',
        format: 'number',
        description: '0 = automatically approve, 1 = manually approve, 2 = no registration required.',
      },
      {
        key: 'audio',
        label: 'Audio Options',
        description: 'One of `both`, `telephony`, `voip`, or `thirdParty`.',
      },
      {
        key: 'auto_recording',
        label: 'Auto Recording',
        description: 'One of `local`, `cloud`, or `none`.',
      },
      {
        key: 'meeting_authentication',
        label: 'Authentication Required',
        format: 'boolean',
        description: 'True when only authenticated users may join.',
      },
      {
        key: 'encryption_type',
        label: 'Encryption Type',
        description: 'Either `enhanced_encryption` or `e2ee`.',
      },
    ],
  },
];

/** `GET /v2/meetings/{meetingId}` — the meeting resource as returned by Find Meeting. */
export const zoomFindMeetingOutputSchema: OutputSchema = {
  fields: meetingFields,
};

/** `POST /v2/users/me/meetings` — the 201 body, the same meeting resource. */
export const zoomCreateMeetingOutputSchema: OutputSchema = {
  fields: meetingFields,
};

/**
 * `PATCH /v2/meetings/{meetingId}` returns 204 with no body, so this action does not
 * pass the Zoom response through — it returns a fixed acknowledgement object it builds
 * itself. The schema describes that object, not a meeting.
 */
export const zoomUpdateMeetingOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
  ],
};
