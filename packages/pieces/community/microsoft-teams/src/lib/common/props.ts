import { DropdownOption, DropdownState, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../auth';
import { microsoftTeamsApi } from './api';
import { microsoftTeamsClient } from './client';

import type {
  CallRecording,
  CallTranscript,
  Channel,
  Chat,
  ConversationMember,
  MicrosoftTeamsPage,
  Team,
} from './types';

function teamId<R extends boolean>({ required, displayName = 'Team ID', description }: PropParams<R>) {
  return Property.Dropdown({
    auth: microsoftTeamsAuth,
    displayName,
    description,
    refreshers: [],
    required,
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Please connect your account first.' });
      }
      const { items, error } = await microsoftTeamsClient.paginate<Team>({
        auth,
        path: '/me/joinedTeams',
        maxItems: DROPDOWN_LIST_MAX,
      });

      if (error && items.length === 0) {
        return disabledOptions({ placeholder: "Couldn't load teams — please retry." });
      }

      return {
        disabled: false,
        options: items.map((team) => ({ label: team.displayName ?? '', value: team.id ?? '' })),
      };
    },
  });
}

function channelId<R extends boolean>({ required, displayName = 'Channel ID', description }: PropParams<R>) {
  return Property.Dropdown({
    auth: microsoftTeamsAuth,
    displayName,
    description,
    refreshers: ['teamId'],
    required,
    options: async ({ auth, teamId }) => {
      if (!auth || !teamId) {
        return disabledOptions({ placeholder: 'Please connect your account first and select team.' });
      }
      const { items, error } = await microsoftTeamsClient.paginate<Channel>({
        auth,
        path: `/teams/${teamId}/channels`,
        maxItems: DROPDOWN_LIST_MAX,
      });

      if (error && items.length === 0) {
        return disabledOptions({ placeholder: "Couldn't load channels — please retry." });
      }

      return {
        disabled: false,
        options: items.map((channel) => ({ label: channel.displayName ?? '', value: channel.id ?? '' })),
      };
    },
  });
}

function memberIds<R extends boolean>({ required, displayName = 'Member', description }: PropParams<R>) {
  return Property.MultiSelectDropdown({
    auth: microsoftTeamsAuth,
    displayName,
    description,
    refreshers: ['teamId'],
    required,
    options: async ({ auth, teamId }) => {
      if (!auth || !teamId) {
        return disabledOptions({ placeholder: 'Please connect your account first and select team.' });
      }
      const { items, error } = await microsoftTeamsClient.paginate<ConversationMember>({
        auth,
        path: `/teams/${teamId}/members`,
        maxItems: DROPDOWN_LIST_MAX,
      });

      if (error && items.length === 0) {
        return disabledOptions({ placeholder: "Couldn't load members — please retry." });
      }

      return {
        disabled: false,
        options: items.map((member) => ({ label: member.displayName ?? '', value: member.id ?? '' })),
      };
    },
  });
}

function chatId<R extends boolean>({ required, displayName = 'Chat ID', description }: PropParams<R>) {
  return Property.Dropdown({
    auth: microsoftTeamsAuth,
    displayName,
    description,
    refreshers: [],
    required,
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Please connect your account first and select team.' });
      }
      const { items, error } = await microsoftTeamsClient.paginate<Chat>({
        auth,
        path: '/chats',
        expand: 'members',
        pageSize: CHATS_PAGE_SIZE,
        maxItems: DROPDOWN_LIST_MAX,
      });

      if (error && items.length === 0) {
        return disabledOptions({ placeholder: "Couldn't load chats — please retry." });
      }

      return {
        disabled: false,
        options: items.map((chat) => {
          const chatName =
            chat.topic ??
            chat.members
              ?.filter((member: ConversationMember) => member.displayName)
              .map((member: ConversationMember) => member.displayName)
              .join(',');
          return {
            label: `(${chat.chatType ? CHAT_TYPE[chat.chatType] : undefined} Chat) ${chatName || '(no title)'}`,
            value: chat.id ?? '',
          };
        }),
      };
    },
  });
}

function meetingIdentifierType<R extends boolean>({
  required,
  displayName = 'Meeting Identifier Type',
  description = 'Choose how to identify the meeting.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    defaultValue: 'meetingId',
    options: {
      disabled: false,
      options: [
        { label: 'Meeting ID', value: 'meetingId' },
        { label: 'Join Web URL', value: 'joinWebUrl' },
        { label: 'Join Meeting ID', value: 'joinMeetingId' },
      ],
    },
  });
}

function meetingIdentifierValue<R extends boolean>({
  required,
  displayName = 'Meeting Identifier Value',
  description,
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function transcriptId<R extends boolean>({ required, displayName = 'Transcript', description }: PropParams<R>) {
  return Property.Dropdown({
    auth: microsoftTeamsAuth,
    displayName,
    description,
    refreshers: ['meetingIdentifierType', 'meetingIdentifierValue'],
    required,
    options: async ({ auth, meetingIdentifierType, meetingIdentifierValue }) => {
      if (
        !auth ||
        !meetingIdentifierType ||
        !meetingIdentifierValue ||
        typeof meetingIdentifierType !== 'string' ||
        typeof meetingIdentifierValue !== 'string'
      ) {
        return disabledOptions({ placeholder: 'Please connect your account first and select a meeting.' });
      }
      const client = microsoftTeamsClient.create({ auth });
      const options: DropdownOption<string>[] = [];

      const meetingId = await microsoftTeamsApi.resolveMeetingId({
        client,
        identifierType: meetingIdentifierType,
        identifierValue: meetingIdentifierValue,
      });

      let response: MicrosoftTeamsPage<CallTranscript> = await client
        .api(`/me/onlineMeetings/${meetingId}/transcripts`)
        .get();
      while (response.value.length > 0) {
        for (const transcript of response.value) {
          const label = transcript.createdDateTime
            ? new Date(transcript.createdDateTime).toLocaleString()
            : transcript.id ?? '';
          options.push({ label, value: transcript.id ?? '' });
        }
        if (response['@odata.nextLink']) {
          response = await client.api(response['@odata.nextLink']).get();
        } else {
          break;
        }
      }
      return { disabled: false, options };
    },
  });
}

function recordingId<R extends boolean>({ required, displayName = 'Recording', description }: PropParams<R>) {
  return Property.Dropdown({
    auth: microsoftTeamsAuth,
    displayName,
    description,
    refreshers: ['meetingIdentifierType', 'meetingIdentifierValue'],
    required,
    options: async ({ auth, meetingIdentifierType, meetingIdentifierValue }) => {
      if (
        !auth ||
        !meetingIdentifierType ||
        !meetingIdentifierValue ||
        typeof meetingIdentifierType !== 'string' ||
        typeof meetingIdentifierValue !== 'string'
      ) {
        return disabledOptions({ placeholder: 'Please connect your account first and select a meeting.' });
      }
      const client = microsoftTeamsClient.create({ auth });
      const options: DropdownOption<string>[] = [];

      const meetingId = await microsoftTeamsApi.resolveMeetingId({
        client,
        identifierType: meetingIdentifierType,
        identifierValue: meetingIdentifierValue,
      });

      let response: MicrosoftTeamsPage<CallRecording> = await client
        .api(`/me/onlineMeetings/${meetingId}/recordings`)
        .get();
      while (response.value.length > 0) {
        for (const recording of response.value) {
          const label = recording.createdDateTime
            ? new Date(recording.createdDateTime).toLocaleString()
            : recording.id ?? '';
          options.push({ label, value: recording.id ?? '' });
        }
        if (response['@odata.nextLink']) {
          response = await client.api(response['@odata.nextLink']).get();
        } else {
          break;
        }
      }
      return { disabled: false, options };
    },
  });
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const microsoftTeamsProps = {
  teamId,
  channelId,
  memberIds,
  chatId,
  meetingIdentifierType,
  meetingIdentifierValue,
  transcriptId,
  recordingId,
};

const CHAT_TYPE: Record<NonNullable<Chat['chatType']>, string> = {
  oneOnOne: '1 : 1',
  group: 'Group',
  meeting: 'Meeting',
  unknownFutureValue: 'Unknown',
};

const CHATS_PAGE_SIZE = 50;
const DROPDOWN_LIST_MAX = 500;

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
