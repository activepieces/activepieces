import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function teamId<R extends boolean>({
  required,
  displayName = 'Team ID',
  description = 'The team ID, from List Joined Teams.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function channelId<R extends boolean>({
  required,
  displayName = 'Channel ID',
  description = 'The channel ID, from List Channels.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function chatId<R extends boolean>({
  required,
  displayName = 'Chat ID',
  description = 'The chat ID, from List Chats.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function userId<R extends boolean>({
  required,
  displayName = 'User ID',
  description = 'The user ID or user principal name, from List Users.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function meetingId<R extends boolean>({
  required,
  displayName = 'Meeting ID',
  description = 'The online meeting ID of a meeting the signed-in user organized (the long ID, not the numeric join ID or the join URL).',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function contentType() {
  return Property.StaticDropdown({
    displayName: 'Content Type',
    description: 'text or html. Must be html when Mentions is not empty.',
    required: true,
    defaultValue: 'text',
    options: {
      disabled: false,
      options: [
        { label: 'Text', value: 'text' },
        { label: 'HTML', value: 'html' },
      ],
    },
  });
}

function mentions() {
  return Property.Array({
    displayName: 'Mentions',
    description:
      'Users to @mention. Item N must appear in Content as <at id="N">displayName</at> (N starts at 0), and Content Type must be html.',
    required: false,
    properties: {
      userId: Property.ShortText({
        displayName: 'User ID',
        description: 'The mentioned user ID (GUID), from List Team Members or List Users.',
        required: true,
      }),
      displayName: Property.ShortText({
        displayName: 'Display Name',
        description: 'The name shown for the mention; the same text as inside its <at> tag.',
        required: true,
      }),
    },
  });
}

function limit({ max, defaultValue }: { max: number; defaultValue: number }) {
  return Property.Number({
    displayName: 'Limit',
    description: `How many items to return on this page, 1 to ${max}. Defaults to ${defaultValue}.`,
    required: false,
    defaultValue,
  });
}

function nextLink() {
  return Property.ShortText({
    displayName: 'Next Page Link',
    description: 'The @odata.nextLink from the previous page. Leave empty for the first page.',
    required: false,
  });
}

export const microsoftTeamsAiProps = { teamId, channelId, chatId, userId, meetingId, contentType, mentions, limit, nextLink };
