import { OutputSchema } from '@activepieces/pieces-framework';

const eventFields: OutputSchema['fields'] = [
  { key: 'eventId', label: 'Event ID' },
  { key: 'roomId', label: 'Room ID' },
  { key: 'sender', label: 'Sender' },
  { key: 'type', label: 'Event Type' },
  { key: 'msgtype', label: 'Message Type', description: 'm.text, m.notice, m.emote, m.image, ... Null for non-message events.' },
  { key: 'body', label: 'Body', description: 'Plain-text body. Null for encrypted or redacted events.' },
  { key: 'formattedBody', label: 'Formatted Body', format: 'html' },
  { key: 'timestamp', label: 'Sent At', format: 'datetime' },
  { key: 'relType', label: 'Relation Type', description: 'm.replace for edits, m.annotation for reactions, m.thread for threads.' },
  { key: 'relatesToEventId', label: 'Relates To Event ID' },
  { key: 'inReplyToEventId', label: 'In Reply To Event ID' },
  { key: 'stateKey', label: 'State Key' },
  { key: 'encrypted', label: 'Encrypted', format: 'boolean', description: 'True for end-to-end encrypted events, which this piece cannot decrypt.' },
  { key: 'redacted', label: 'Redacted', format: 'boolean' },
];

const sentFields: OutputSchema['fields'] = [
  { key: 'eventId', label: 'Event ID' },
  { key: 'roomId', label: 'Room ID' },
  { key: 'transactionId', label: 'Transaction ID', description: 'Send again with this ID to retry without posting a duplicate.' },
];

const membershipFields: OutputSchema['fields'] = [
  { key: 'roomId', label: 'Room ID' },
  { key: 'userId', label: 'User ID' },
  { key: 'membership', label: 'Membership', description: 'The membership the user now has: invite, leave or ban.' },
];

const publicRoomFields: OutputSchema['fields'] = [
  { key: 'roomId', label: 'Room ID' },
  { key: 'name', label: 'Name' },
  { key: 'topic', label: 'Topic' },
  { key: 'canonicalAlias', label: 'Alias' },
  { key: 'numJoinedMembers', label: 'Members', format: 'number' },
  { key: 'worldReadable', label: 'World Readable', format: 'boolean' },
  { key: 'guestCanJoin', label: 'Guests Can Join', format: 'boolean' },
  { key: 'joinRule', label: 'Join Rule' },
  { key: 'roomType', label: 'Room Type', description: 'm.space for spaces, null for normal rooms.' },
  { key: 'avatarUrl', label: 'Avatar (mxc URI)' },
];

const userFields: OutputSchema['fields'] = [
  { key: 'userId', label: 'User ID' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'avatarUrl', label: 'Avatar (mxc URI)' },
];

export const matrixOutputSchemas = {
  sent: { fields: sentFields } satisfies OutputSchema,
  edited: {
    fields: [...sentFields, { key: 'editedEventId', label: 'Edited Event ID' }],
  } satisfies OutputSchema,
  reaction: {
    fields: [
      { key: 'eventId', label: 'Reaction Event ID', description: 'Null when this account had already reacted with the same key.' },
      { key: 'roomId', label: 'Room ID' },
      { key: 'reactedToEventId', label: 'Reacted To Event ID' },
      { key: 'key', label: 'Reaction' },
      { key: 'alreadyReacted', label: 'Already Reacted', format: 'boolean' },
      { key: 'transactionId', label: 'Transaction ID' },
    ],
  } satisfies OutputSchema,
  redaction: {
    fields: [
      { key: 'redactionEventId', label: 'Redaction Event ID' },
      { key: 'roomId', label: 'Room ID' },
      { key: 'redactedEventId', label: 'Redacted Event ID' },
      { key: 'transactionId', label: 'Transaction ID' },
    ],
  } satisfies OutputSchema,
  event: { fields: eventFields } satisfies OutputSchema,
  listMessages: {
    fields: [
      { key: 'items', label: 'Events', labelKey: 'body', listItems: eventFields },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextToken', label: 'Next Token', description: 'Pass as From to get the next page. Null when there is no more.' },
    ],
  } satisfies OutputSchema,
  currentUser: {
    fields: [
      { key: 'userId', label: 'User ID' },
      { key: 'deviceId', label: 'Device ID' },
      { key: 'isGuest', label: 'Guest', format: 'boolean' },
      { key: 'homeserver', label: 'Homeserver', format: 'url' },
    ],
  } satisfies OutputSchema,
  joinedRooms: {
    fields: [
      {
        key: 'items',
        label: 'Rooms',
        labelKey: 'name',
        listItems: [
          { key: 'roomId', label: 'Room ID' },
          { key: 'name', label: 'Name' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'total', label: 'Total Joined Rooms', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextOffset', label: 'Next Offset', format: 'number' },
    ],
  } satisfies OutputSchema,
  room: {
    fields: [
      { key: 'roomId', label: 'Room ID' },
      { key: 'name', label: 'Name' },
      { key: 'topic', label: 'Topic' },
      { key: 'canonicalAlias', label: 'Alias' },
      { key: 'altAliases', label: 'Other Aliases' },
      { key: 'encrypted', label: 'Encrypted', format: 'boolean' },
      { key: 'joinRule', label: 'Join Rule' },
      { key: 'historyVisibility', label: 'History Visibility' },
      { key: 'roomVersion', label: 'Room Version' },
      { key: 'creator', label: 'Creator' },
      { key: 'roomType', label: 'Room Type' },
      { key: 'joinedMemberCount', label: 'Joined Members', format: 'number' },
      { key: 'invitedMemberCount', label: 'Invited Members', format: 'number' },
    ],
  } satisfies OutputSchema,
  publicRooms: {
    fields: [
      { key: 'items', label: 'Rooms', labelKey: 'name', listItems: publicRoomFields },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'totalEstimate', label: 'Total (estimate)', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextToken', label: 'Next Token' },
    ],
  } satisfies OutputSchema,
  createdRoom: {
    fields: [
      { key: 'roomId', label: 'Room ID' },
      { key: 'alias', label: 'Alias', description: 'The full alias (#name:server) when Alias was given, otherwise null.' },
    ],
  } satisfies OutputSchema,
  joinedRoom: { fields: [{ key: 'roomId', label: 'Room ID' }] } satisfies OutputSchema,
  leftRoom: {
    fields: [
      { key: 'roomId', label: 'Room ID' },
      { key: 'left', label: 'Left', format: 'boolean' },
      { key: 'forgotten', label: 'Forgotten', format: 'boolean' },
    ],
  } satisfies OutputSchema,
  membership: { fields: membershipFields } satisfies OutputSchema,
  stateSet: {
    fields: [
      { key: 'eventId', label: 'State Event ID' },
      { key: 'roomId', label: 'Room ID' },
    ],
  } satisfies OutputSchema,
  members: {
    fields: [
      { key: 'items', label: 'Members', labelKey: 'displayName', listItems: userFields },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  } satisfies OutputSchema,
  profile: { fields: userFields } satisfies OutputSchema,
  searchUsers: {
    fields: [
      { key: 'items', label: 'Users', labelKey: 'displayName', listItems: userFields },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'limited', label: 'Limited', format: 'boolean', description: 'True when the server cut the results off at the limit.' },
    ],
  } satisfies OutputSchema,
};
