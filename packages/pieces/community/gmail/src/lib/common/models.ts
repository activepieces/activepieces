export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility: GmailMessageListVisibility;
  labelListVisibility: GmailLabelListVisibility;
  type: GmailLabelType;
  messagesTotal: number;
  messagesUnread: number;
  threadsTotal: number;
  threadsUnread: number;
  color: {
    textColor: string;
    backgroundColor: string;
  };
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: [string];
  snippet: string;
  historyId: string;
  internalDate: number;
  payload: {
    partId: string;
    mimeType: string;
    filename: string;
    headers: {
      name: string;
      value: string;
    }[];
    body: {
      data: any;
      size: number;
    };
    parts: {
      parts: any[];
      partId: string;
      mimeType: string;
      filename: string;
      headers: {
        name: string;
        value: string;
      }[];
      body: {
        size: number;
        data: string;
      };
    }[];
  };
  sizeEstimate: number;
  raw: string;
}

export interface GmailThread {
  id: string;
  snippet: string;
  historyId: string;
  messages: GmailMessage[];
}

export interface GmailMessageResponse {
  messages: {
    id: string;
    threadId: string;
  }[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

enum GmailMessageListVisibility {
  SHOW = 'show',
  HIDE = 'hide',
}

enum GmailLabelListVisibility {
  SHOW = 'show',
  HIDE = 'hide',
}

enum GmailLabelType {
  SYSTEM = 'system',
  USER = 'user',
}

export enum GmailMessageFormat {
  MINIMAL = 'minimal',
  FULL = 'full',
  RAW = 'raw',
  METADATA = 'metadata',
}
