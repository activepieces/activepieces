export interface GoogleChatSpace {
  name: string;
  displayName?: string;
  type: string;
  singleUserBotDm?: boolean;
  threaded?: boolean;
  spaceType: string;
  spaceThreadingState: string;
  spaceHistoryState: string;
  importMode: boolean;
  createdTime: string;
  updatedTime: string;
}

export interface GoogleChatMessage {
  name: string;
  sender: {
    name: string;
    displayName: string;
    type: 'HUMAN' | 'BOT';
    domainId?: string;
  };
  createTime: string;
  updateTime: string;
  text?: string;
  formattedText?: string;
  thread?: {
    name: string;
    threadKey?: string;
  };
  space: {
    name: string;
    type: string;
    displayName?: string;
  };
  annotations?: GoogleChatAnnotation[];
  argumentText?: string;
  matchedUrl?: {
    url: string;
  };
  retentionSettings?: {
    state: string;
  };
}

export interface GoogleChatAnnotation {
  type: string;
  startIndex: number;
  length: number;
  userMention?: {
    user: {
      name: string;
      displayName: string;
      type: 'HUMAN' | 'BOT';
    };
  };
  slashCommand?: {
    bot: {
      name: string;
      displayName: string;
    };
    typeId: string;
    commandName: string;
    triggersDialog: boolean;
  };
}

export interface GoogleChatMember {
  name: string;
  state: string;
  role: 'ROLE_UNSPECIFIED' | 'MEMBER' | 'ADMIN';
  member: {
    name: string;
    displayName: string;
    type: 'HUMAN' | 'BOT';
    domainId?: string;
  };
  createTime: string;
  updateTime: string;
}

export interface GoogleChatSpacesResponse {
  spaces: GoogleChatSpace[];
  nextPageToken?: string;
}

export interface GoogleChatMessagesResponse {
  messages: GoogleChatMessage[];
  nextPageToken?: string;
}

export interface GoogleChatMembersResponse {
  memberships: GoogleChatMember[];
  nextPageToken?: string;
}

export interface GoogleChatWebhookPayload {
  type: string;
  message?: GoogleChatMessage;
  space?: GoogleChatSpace;
  user?: {
    name: string;
    displayName: string;
    type: 'HUMAN' | 'BOT';
  };
} 