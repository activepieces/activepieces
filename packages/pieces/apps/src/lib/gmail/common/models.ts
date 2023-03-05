export interface GmailLabel {
  id: string,
  name: string,
  messageListVisibility: GmailMessageListVisibility,
  labelListVisibility: GmailLabelListVisibility,
  type: GmailLabelType,
  messagesTotal: number,
  messagesUnread: number,
  threadsTotal: number,
  threadsUnread: number,
  color: {
    textColor: string,
    backgroundColor: string
  }
}

export interface GmailMessage {
  id: string
  threadId: string
  labelIds: [
    string
  ],
  snippet: string
  historyId: string
  internalDate: string
  payload: object
  sizeEstimate: number
  raw: string
}

export interface GmailMessageResponse {
  messages: {
    id: string
    threadId: string
  }[]
  resultSizeEstimate: number
}

enum GmailMessageListVisibility {
  SHOW = "show",
  HIDE = "hide"
}

enum GmailLabelListVisibility {
  SHOW = "show",
  HIDE = "hide"
}

enum GmailLabelType {
  system = "system",
  user = "user"
}
