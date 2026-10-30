import { OutputSchema } from '@activepieces/pieces-framework';

const meetingOrganizerField: OutputSchema['fields'][number] = {
  key: 'meetingOrganizer',
  label: 'Meeting Organizer',
  children: [
    {
      key: 'user',
      label: 'User',
      children: [
        { key: 'id', label: 'User ID' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'tenantId', label: 'Tenant ID' },
      ],
    },
  ],
};

const callTranscriptFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Transcript ID' },
  { key: 'meetingId', label: 'Meeting ID' },
  { key: 'callId', label: 'Call ID' },
  { key: 'contentCorrelationId', label: 'Content Correlation ID' },
  {
    key: 'transcriptContentUrl',
    label: 'Transcript Content URL',
    format: 'url',
  },
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
  { key: 'endDateTime', label: 'Ended At', format: 'datetime' },
  meetingOrganizerField,
];

const callRecordingFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Recording ID' },
  { key: 'meetingId', label: 'Meeting ID' },
  { key: 'callId', label: 'Call ID' },
  { key: 'contentCorrelationId', label: 'Content Correlation ID' },
  { key: 'recordingContentUrl', label: 'Recording Content URL', format: 'url' },
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
  { key: 'endDateTime', label: 'Ended At', format: 'datetime' },
  meetingOrganizerField,
];

const odataContextField: Field = {
  key: '@odata.context',
  label: 'OData Context',
  value: "['@odata.context']",
  format: 'url',
};

const odataCountField: Field = {
  key: '@odata.count',
  label: 'Items on This Page',
  value: "['@odata.count']",
  format: 'number',
};

const odataNextLinkField: Field = {
  key: '@odata.nextLink',
  label: 'Next Page Link',
  value: "['@odata.nextLink']",
  format: 'url',
};

const odataIdField: Field = {
  key: '@odata.id',
  label: 'OData ID',
  value: "['@odata.id']",
  format: 'url',
};

const odataTypeField: Field = {
  key: '@odata.type',
  label: 'OData Type',
  value: "['@odata.type']",
};

const identityUserFields: OutputSchema['fields'] = [
  odataTypeField,
  { key: 'id', label: 'User ID' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'userIdentityType', label: 'User Identity Type' },
  { key: 'tenantId', label: 'Tenant ID' },
];

const identitySetFields: OutputSchema['fields'] = [
  { key: 'application', label: 'Application' },
  { key: 'device', label: 'Device' },
  { key: 'user', label: 'User', children: identityUserFields },
];

const channelFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Channel ID' },
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'description', label: 'Description' },
  {
    key: 'isFavoriteByDefault',
    label: 'Favorite by Default',
    format: 'boolean',
  },
  { key: 'email', label: 'Channel Email', format: 'email' },
  { key: 'tenantId', label: 'Tenant ID' },
  { key: 'webUrl', label: 'Web URL', format: 'url' },
  { key: 'membershipType', label: 'Membership Type' },
  { key: 'layoutType', label: 'Layout Type' },
  { key: 'isArchived', label: 'Archived', format: 'boolean' },
];

const channelSummaryField: Field = {
  key: 'summary',
  label: 'Summary',
  children: [
    { key: 'ownersCount', label: 'Owners', format: 'number' },
    { key: 'membersCount', label: 'Members', format: 'number' },
    { key: 'guestsCount', label: 'Guests', format: 'number' },
    {
      key: 'hasMembersFromOtherTenants',
      label: 'Has Members From Other Tenants',
      format: 'boolean',
    },
  ],
};

const conversationMemberFields: OutputSchema['fields'] = [
  odataTypeField,
  { key: 'id', label: 'Membership ID' },
  { key: 'roles', label: 'Roles' },
  { key: 'displayName', label: 'Display Name' },
  {
    key: 'visibleHistoryStartDateTime',
    label: 'History Visible From',
    format: 'datetime',
  },
  { key: 'userId', label: 'User ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'tenantId', label: 'Tenant ID' },
];

const chatScalarFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Chat ID' },
  { key: 'topic', label: 'Topic' },
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
  { key: 'lastUpdatedDateTime', label: 'Last Updated At', format: 'datetime' },
  { key: 'chatType', label: 'Chat Type' },
  { key: 'webUrl', label: 'Web URL', format: 'url' },
  { key: 'tenantId', label: 'Tenant ID' },
  {
    key: 'isHiddenForAllMembers',
    label: 'Hidden for All Members',
    format: 'boolean',
  },
];

const viewpointField: Field = {
  key: 'viewpoint',
  label: 'Viewpoint',
  children: [
    { key: 'isHidden', label: 'Hidden', format: 'boolean' },
    {
      key: 'lastMessageReadDateTime',
      label: 'Last Message Read At',
      format: 'datetime',
    },
  ],
};

const onlineMeetingInfoField: Field = {
  key: 'onlineMeetingInfo',
  label: 'Online Meeting Info',
  children: [
    { key: 'calendarEventId', label: 'Calendar Event ID' },
    { key: 'joinWebUrl', label: 'Join URL', format: 'url' },
    {
      key: 'organizer',
      label: 'Organizer',
      children: [
        { key: 'id', label: 'User ID' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'userIdentityType', label: 'User Identity Type' },
      ],
    },
  ],
};

const chatFields: OutputSchema['fields'] = [
  ...chatScalarFields,
  { key: 'viewpoint', label: 'Viewpoint' },
  { key: 'onlineMeetingInfo', label: 'Online Meeting Info' },
];

const chatDetailFields: OutputSchema['fields'] = [
  ...chatScalarFields,
  viewpointField,
  onlineMeetingInfoField,
];

const mentionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Mention ID', format: 'number' },
  { key: 'mentionText', label: 'Mention Text' },
  {
    key: 'mentioned',
    label: 'Mentioned',
    children: [
      { key: 'application', label: 'Application' },
      { key: 'device', label: 'Device' },
      { key: 'conversation', label: 'Conversation' },
      { key: 'tag', label: 'Tag' },
      { key: 'user', label: 'User', children: identityUserFields },
    ],
  },
];

const attachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Attachment ID' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'contentUrl', label: 'Content URL', format: 'url' },
  { key: 'content', label: 'Content' },
  { key: 'name', label: 'Name' },
  { key: 'thumbnailUrl', label: 'Thumbnail URL', format: 'image' },
  { key: 'teamsAppId', label: 'Teams App ID' },
];

const eventDetailField: Field = {
  key: 'eventDetail',
  label: 'Event Detail',
  children: [
    odataTypeField,
    { key: 'callId', label: 'Call ID' },
    { key: 'callRecordingDisplayName', label: 'Call Recording Name' },
    { key: 'callRecordingUrl', label: 'Call Recording URL', format: 'url' },
    {
      key: 'callRecordingDuration',
      label: 'Call Recording Duration',
      format: 'duration',
    },
    { key: 'callRecordingStatus', label: 'Call Recording Status' },
    {
      key: 'meetingOrganizer',
      label: 'Meeting Organizer',
      children: identitySetFields,
    },
    { key: 'initiator', label: 'Initiator', children: identitySetFields },
  ],
};

const channelIdentityField: Field = {
  key: 'channelIdentity',
  label: 'Channel Identity',
  children: [
    { key: 'teamId', label: 'Team ID' },
    { key: 'channelId', label: 'Channel ID' },
  ],
};

const messageCoreFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Message ID' },
  { key: 'replyToId', label: 'Reply To ID' },
  { key: 'etag', label: 'Etag' },
  { key: 'messageType', label: 'Message Type' },
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
  {
    key: 'lastModifiedDateTime',
    label: 'Last Modified At',
    format: 'datetime',
  },
  { key: 'lastEditedDateTime', label: 'Last Edited At', format: 'datetime' },
  { key: 'deletedDateTime', label: 'Deleted At', format: 'datetime' },
  { key: 'subject', label: 'Subject' },
  { key: 'summary', label: 'Summary' },
  { key: 'chatId', label: 'Chat ID' },
  { key: 'importance', label: 'Importance' },
  { key: 'locale', label: 'Locale' },
  { key: 'webUrl', label: 'Web URL', format: 'url' },
  { key: 'policyViolation', label: 'Policy Violation' },
  { key: 'from', label: 'From', children: identitySetFields },
  {
    key: 'body',
    label: 'Body',
    children: [
      { key: 'contentType', label: 'Content Type' },
      { key: 'content', label: 'Content' },
    ],
  },
  { key: 'reactions', label: 'Reactions' },
];

const buildMessageFields = ({
  channel = false,
  eventDetail = false,
  attachments = false,
  mentions = false,
}: {
  channel?: boolean;
  eventDetail?: boolean;
  attachments?: boolean;
  mentions?: boolean;
}): OutputSchema['fields'] => [
  ...messageCoreFields,
  eventDetail
    ? eventDetailField
    : { key: 'eventDetail', label: 'Event Detail' },
  channel
    ? channelIdentityField
    : { key: 'channelIdentity', label: 'Channel Identity' },
  attachments
    ? {
        key: 'attachments',
        label: 'Attachments',
        labelKey: 'name',
        listItems: attachmentFields,
      }
    : { key: 'attachments', label: 'Attachments' },
  mentions
    ? {
        key: 'mentions',
        label: 'Mentions',
        labelKey: 'mentionText',
        listItems: mentionFields,
      }
    : { key: 'mentions', label: 'Mentions' },
];

const chatMessageFields = buildMessageFields({});
const chatMessageWithMentionsFields = buildMessageFields({ mentions: true });
const chatMessageHistoryFields = buildMessageFields({
  eventDetail: true,
  mentions: true,
});
const chatMessageWithAttachmentsFields = buildMessageFields({
  attachments: true,
});
const channelMessageFields = buildMessageFields({ channel: true });
const channelMessageWithMentionsFields = buildMessageFields({
  channel: true,
  mentions: true,
});

const presenceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'availability', label: 'Availability' },
  { key: 'activity', label: 'Activity' },
  { key: 'sequenceNumber', label: 'Sequence Number' },
  { key: 'statusMessage', label: 'Status Message' },
  { key: 'workLocation', label: 'Work Location' },
  {
    key: 'outOfOfficeSettings',
    label: 'Out of Office Settings',
    children: [
      { key: 'message', label: 'Message' },
      { key: 'isOutOfOffice', label: 'Out of Office', format: 'boolean' },
    ],
  },
];

const userFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'givenName', label: 'First Name' },
  { key: 'surname', label: 'Last Name' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'mail', label: 'Email', format: 'email' },
  { key: 'userPrincipalName', label: 'User Principal Name', format: 'email' },
  { key: 'businessPhones', label: 'Business Phones' },
  { key: 'mobilePhone', label: 'Mobile Phone' },
  { key: 'officeLocation', label: 'Office Location' },
  { key: 'preferredLanguage', label: 'Preferred Language' },
];

const teamScalarFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Team ID' },
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'description', label: 'Description' },
  { key: 'internalId', label: 'Internal ID' },
  { key: 'classification', label: 'Classification' },
  { key: 'specialization', label: 'Specialization' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'webUrl', label: 'Web URL', format: 'url' },
  { key: 'isArchived', label: 'Archived', format: 'boolean' },
  {
    key: 'isMembershipLimitedToOwners',
    label: 'Membership Limited to Owners',
    format: 'boolean',
  },
];

const teamSettingsFields: OutputSchema['fields'] = [
  {
    key: 'discoverySettings',
    label: 'Discovery Settings',
    children: [
      {
        key: 'showInTeamsSearchAndSuggestions',
        label: 'Show in Teams Search and Suggestions',
        format: 'boolean',
      },
    ],
  },
  { key: 'tagSettings', label: 'Tag Settings' },
  {
    key: 'memberSettings',
    label: 'Member Settings',
    children: [
      {
        key: 'allowCreateUpdateChannels',
        label: 'Allow Create and Update Channels',
        format: 'boolean',
      },
      {
        key: 'allowCreatePrivateChannels',
        label: 'Allow Create Private Channels',
        format: 'boolean',
      },
      {
        key: 'allowDeleteChannels',
        label: 'Allow Delete Channels',
        format: 'boolean',
      },
      {
        key: 'allowAddRemoveApps',
        label: 'Allow Add and Remove Apps',
        format: 'boolean',
      },
      {
        key: 'allowCreateUpdateRemoveTabs',
        label: 'Allow Create, Update and Remove Tabs',
        format: 'boolean',
      },
      {
        key: 'allowCreateUpdateRemoveConnectors',
        label: 'Allow Create, Update and Remove Connectors',
        format: 'boolean',
      },
    ],
  },
  {
    key: 'guestSettings',
    label: 'Guest Settings',
    children: [
      {
        key: 'allowCreateUpdateChannels',
        label: 'Allow Create and Update Channels',
        format: 'boolean',
      },
      {
        key: 'allowDeleteChannels',
        label: 'Allow Delete Channels',
        format: 'boolean',
      },
    ],
  },
  {
    key: 'messagingSettings',
    label: 'Messaging Settings',
    children: [
      {
        key: 'allowUserEditMessages',
        label: 'Allow Users to Edit Messages',
        format: 'boolean',
      },
      {
        key: 'allowUserDeleteMessages',
        label: 'Allow Users to Delete Messages',
        format: 'boolean',
      },
      {
        key: 'allowOwnerDeleteMessages',
        label: 'Allow Owners to Delete Messages',
        format: 'boolean',
      },
      {
        key: 'allowTeamMentions',
        label: 'Allow Team Mentions',
        format: 'boolean',
      },
      {
        key: 'allowChannelMentions',
        label: 'Allow Channel Mentions',
        format: 'boolean',
      },
    ],
  },
  {
    key: 'funSettings',
    label: 'Fun Settings',
    children: [
      { key: 'allowGiphy', label: 'Allow Giphy', format: 'boolean' },
      { key: 'giphyContentRating', label: 'Giphy Content Rating' },
      {
        key: 'allowStickersAndMemes',
        label: 'Allow Stickers and Memes',
        format: 'boolean',
      },
      {
        key: 'allowCustomMemes',
        label: 'Allow Custom Memes',
        format: 'boolean',
      },
    ],
  },
  {
    key: 'summary',
    label: 'Summary',
    children: [
      { key: 'ownersCount', label: 'Owners', format: 'number' },
      { key: 'membersCount', label: 'Members', format: 'number' },
      { key: 'guestsCount', label: 'Guests', format: 'number' },
    ],
  },
];

const teamFields: OutputSchema['fields'] = [
  ...teamScalarFields,
  { key: 'tenantId', label: 'Tenant ID' },
  { key: 'discoverySettings', label: 'Discovery Settings' },
  { key: 'tagSettings', label: 'Tag Settings' },
  { key: 'memberSettings', label: 'Member Settings' },
  { key: 'guestSettings', label: 'Guest Settings' },
  { key: 'messagingSettings', label: 'Messaging Settings' },
  { key: 'funSettings', label: 'Fun Settings' },
  { key: 'summary', label: 'Summary' },
];

const hostedContentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Hosted Content ID' },
  { key: 'contentBase64', label: 'Content (Base64)' },
];

const messageActionFields: OutputSchema['fields'] = [
  { key: 'chatId', label: 'Chat ID' },
  { key: 'messageId', label: 'Message ID' },
];

export const microsoftTeamsCreateChannelOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    ...channelFields.filter((f) => f.key !== 'tenantId'),
  ],
};

export const microsoftTeamsCreateChatOutputSchema: OutputSchema = {
  fields: [odataContextField, ...chatFields],
};

export const microsoftTeamsCreateChatAndSendMessageOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'chat',
        label: 'Chat',
        children: [odataContextField, ...chatFields],
      },
      {
        key: 'message',
        label: 'Message',
        children: [odataContextField, ...chatMessageFields],
      },
    ],
  };

export const microsoftTeamsCreatePrivateChannelOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    ...channelFields.filter((f) => f.key !== 'tenantId'),
  ],
};

export const microsoftTeamsDeleteChatMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    ...messageActionFields,
  ],
};

export const microsoftTeamsFindChannelOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'result', label: 'Matching Channels', labelKey: 'displayName', listItems: [
      odataIdField,
      ...channelFields,
    ] },
  ],
};

export const microsoftTeamsFindTeamMemberOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'result', label: 'Matching Members', labelKey: 'displayName', listItems: conversationMemberFields },
  ],
};

export const microsoftTeamsGetChannelOutputSchema: OutputSchema = {
  fields: [odataContextField, ...channelFields, channelSummaryField],
};

export const microsoftTeamsGetChannelMessageOutputSchema: OutputSchema = {
  fields: [odataContextField, ...channelMessageFields],
};

export const microsoftTeamsGetChannelMessageByIdOutputSchema: OutputSchema = {
  fields: [odataContextField, ...channelMessageWithMentionsFields],
};

export const microsoftTeamsGetChannelMessageHostedContentOutputSchema: OutputSchema =
  {
    fields: hostedContentFields,
  };

export const microsoftTeamsGetChatOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    ...chatDetailFields,
    {
      key: 'members@odata.context',
      label: 'Members OData Context',
      value: "['members@odata.context']",
      format: 'url',
    },
    { key: 'members', label: 'Members', labelKey: 'displayName', listItems: conversationMemberFields },
  ],
};

export const microsoftTeamsGetChatMemberOutputSchema: OutputSchema = {
  fields: [odataContextField, ...conversationMemberFields],
};

export const microsoftTeamsGetChatMessageOutputSchema: OutputSchema = {
  fields: [odataContextField, ...chatMessageFields],
};

export const microsoftTeamsGetChatMessageByIdOutputSchema: OutputSchema = {
  fields: [odataContextField, ...chatMessageWithMentionsFields],
};

export const microsoftTeamsGetChatMessageHostedContentOutputSchema: OutputSchema =
  {
    fields: [
      ...hostedContentFields.slice(0, 1),
      ...messageActionFields,
      ...hostedContentFields.slice(1),
    ],
  };

export const microsoftTeamsGetCurrentUserOutputSchema: OutputSchema = {
  fields: [odataContextField, ...userFields],
};

export const microsoftTeamsGetMyPresenceOutputSchema: OutputSchema = {
  fields: [odataContextField, ...presenceFields],
};

export const microsoftTeamsGetPresencesByUserIdsOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    { key: 'value', label: 'Presences', labelKey: 'availability', listItems: presenceFields },
  ],
};

export const microsoftTeamsGetTeamOutputSchema: OutputSchema = {
  fields: [odataContextField, ...teamScalarFields, ...teamSettingsFields],
};

export const microsoftTeamsGetTeamsLicensingDetailsOutputSchema: OutputSchema =
  {
    fields: [
      odataContextField,
      { key: 'hasTeamsLicense', label: 'Has Teams License', format: 'boolean' },
    ],
  };

export const microsoftTeamsHideChatOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const microsoftTeamsListAllChannelsOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    odataCountField,
    { key: 'value', label: 'Channels', labelKey: 'displayName', listItems: [odataIdField, ...channelFields] },
  ],
};

export const microsoftTeamsListAssociatedTeamsOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    odataCountField,
    { key: 'value', label: 'Associated Teams', labelKey: 'displayName', listItems: [
      { key: 'id', label: 'Team ID' },
      { key: 'tenantId', label: 'Tenant ID' },
      { key: 'displayName', label: 'Display Name' },
    ] },
  ],
};

export const microsoftTeamsListChannelMessageHostedContentsOutputSchema: OutputSchema =
  {
    fields: [
      odataContextField,
      odataCountField,
      { key: 'value', label: 'Hosted Contents' },
    ],
  };

export const microsoftTeamsListChannelMessageRepliesOutputSchema: OutputSchema =
  {
    fields: [
      odataContextField,
      odataCountField,
      { key: 'value', label: 'Replies', labelKey: 'id', listItems: channelMessageFields },
    ],
  };

export const microsoftTeamsListChannelMessagesOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    odataCountField,
    { key: 'value', label: 'Messages', labelKey: 'subject', listItems: channelMessageWithMentionsFields },
  ],
};

export const microsoftTeamsListChannelsOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    odataCountField,
    { key: 'value', label: 'Channels', labelKey: 'displayName', listItems: channelFields },
  ],
};

export const microsoftTeamsListChatMembersOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    odataCountField,
    { key: 'value', label: 'Members', labelKey: 'displayName', listItems: conversationMemberFields },
  ],
};

export const microsoftTeamsListChatMessagesOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    odataCountField,
    odataNextLinkField,
    { key: 'value', label: 'Messages', labelKey: 'id', listItems: chatMessageHistoryFields },
  ],
};

export const microsoftTeamsListChatsOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    odataCountField,
    { key: 'value', label: 'Chats', labelKey: 'topic', listItems: chatDetailFields },
  ],
};

export const microsoftTeamsListJoinedTeamsOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    odataCountField,
    { key: 'value', label: 'Teams', labelKey: 'displayName', listItems: teamFields },
  ],
};

export const microsoftTeamsListPinnedChatMessagesOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    odataCountField,
    { key: 'value', label: 'Pinned Messages', labelKey: 'id', listItems: [
      { key: 'id', label: 'Pinned Message ID' },
      { key: 'message', label: 'Message', children: chatMessageFields },
    ] },
  ],
};

export const microsoftTeamsListTeamsOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    odataCountField,
    { key: 'value', label: 'Teams', labelKey: 'displayName', listItems: teamFields.filter((f) => f.key !== 'tenantId') },
  ],
};

export const microsoftTeamsListUsersOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    { key: 'value', label: 'Users', labelKey: 'displayName', listItems: userFields },
  ],
};

export const microsoftTeamsPinChatMessageOutputSchema: OutputSchema = {
  fields: [odataContextField, { key: 'id', label: 'Pinned Message ID' }],
};

export const microsoftTeamsSearchMessagesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Search Results',
      listItems: [
        { key: 'searchTerms', label: 'Search Terms' },
        {
          key: 'hitsContainers',
          label: 'Hit Containers',
          listItems: [
            {
              key: 'hits',
              label: 'Hits',
              labelKey: 'summary',
              listItems: [
                { key: 'hitId', label: 'Hit ID' },
                { key: 'rank', label: 'Rank', format: 'number' },
                { key: 'summary', label: 'Summary' },
                {
                  key: 'resource',
                  label: 'Message',
                  children: [
                    odataTypeField,
                    { key: 'id', label: 'Message ID' },
                    {
                      key: 'createdDateTime',
                      label: 'Created At',
                      format: 'datetime',
                    },
                    {
                      key: 'lastModifiedDateTime',
                      label: 'Last Modified At',
                      format: 'datetime',
                    },
                    { key: 'importance', label: 'Importance' },
                    { key: 'webLink', label: 'Web Link', format: 'url' },
                    {
                      key: 'from',
                      label: 'From',
                      children: [
                        { key: 'emailAddress', label: 'Email Address' },
                      ],
                    },
                    {
                      key: 'channelIdentity',
                      label: 'Channel Identity',
                      children: [
                        { key: 'channelId', label: 'Channel ID' },
                        { key: 'teamId', label: 'Team ID' },
                      ],
                    },
                    { key: 'etag', label: 'Etag' },
                    { key: 'chatId', label: 'Chat ID' },
                  ],
                },
              ],
            },
            { key: 'total', label: 'Total Hits', format: 'number' },
            {
              key: 'moreResultsAvailable',
              label: 'More Results Available',
              format: 'boolean',
            },
          ],
        },
      ],
    },
    odataContextField,
  ],
};

export const microsoftTeamsSetChannelMessageReactionOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'reactionType', label: 'Reaction Type' },
    ],
  };

export const microsoftTeamsSetChatMessageReactionOutputSchema: OutputSchema = {
  fields: [
    { key: 'reactionSet', label: 'Reaction Set', format: 'boolean' },
    ...messageActionFields,
    { key: 'reactionType', label: 'Reaction Type' },
  ],
};

export const microsoftTeamsSoftDeleteChatMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'softDeleted', label: 'Soft Deleted', format: 'boolean' },
    ...messageActionFields,
  ],
};

export const microsoftTeamsUndoSoftDeleteChatMessageOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'restored', label: 'Restored', format: 'boolean' },
      ...messageActionFields,
    ],
  };

export const microsoftTeamsUnsetChatMessageReactionOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'reactionRemoved', label: 'Reaction Removed', format: 'boolean' },
      ...messageActionFields,
      { key: 'reactionType', label: 'Reaction Type' },
    ],
  };

export const microsoftTeamsUpdateChatMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'updated', label: 'Updated', format: 'boolean' },
    ...messageActionFields,
  ],
};

export const newChannelOutputSchema: OutputSchema = { fields: channelFields };

export const newChannelMessageOutputSchema: OutputSchema = {
  fields: channelMessageWithMentionsFields,
};

export const newChatOutputSchema: OutputSchema = {
  fields: [
    ...chatScalarFields,
    { key: 'onlineMeetingInfo', label: 'Online Meeting Info' },
    viewpointField,
  ],
};

export const newChatMessageOutputSchema: OutputSchema = {
  fields: chatMessageWithAttachmentsFields,
};

export const requestApprovalDirectMessageOutputSchema: OutputSchema = {
  fields: [{ key: 'approved', label: 'Approved', format: 'boolean' }],
};

export const microsoftTeamsListMeetingTranscriptsOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    { key: 'value', label: 'Transcripts', labelKey: 'createdDateTime', listItems: callTranscriptFields },
  ],
};

export const microsoftTeamsGetMeetingTranscriptDetailsOutputSchema: OutputSchema =
  {
    fields: callTranscriptFields,
  };

export const microsoftTeamsGetMeetingTranscriptContentOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'transcriptId', label: 'Transcript ID' },
      { key: 'format', label: 'Format' },
      { key: 'content', label: 'Content' },
    ],
  };

export const microsoftTeamsListMeetingRecordingsOutputSchema: OutputSchema = {
  fields: [
    odataContextField,
    { key: 'value', label: 'Recordings', labelKey: 'createdDateTime', listItems: callRecordingFields },
  ],
};

export const microsoftTeamsGetMeetingRecordingDetailsOutputSchema: OutputSchema =
  {
    fields: callRecordingFields,
  };

export const microsoftTeamsGetMeetingTranscriptOutputSchema: OutputSchema = {
  fields: [
    { key: 'content', label: 'Transcript Content' },
    { key: 'value', label: 'Transcripts', labelKey: 'createdDateTime', listItems: callTranscriptFields },
  ],
};

export const microsoftTeamsGetMeetingRecordingOutputSchema: OutputSchema = {
  fields: [
    ...callRecordingFields,
    { key: 'value', label: 'Recordings', labelKey: 'createdDateTime', listItems: callRecordingFields },
  ],
};

type Field = OutputSchema['fields'][number];
