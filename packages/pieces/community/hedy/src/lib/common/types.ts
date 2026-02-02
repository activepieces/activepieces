export interface Topic {
  id: string;
  name: string;
  color?: string;
  iconName?: string;
}

export interface Todo {
  id: string;
  text: string;
  dueDate?: string;
  completed: boolean;
  topic?: Topic;
}

export interface Conversation {
  question: string;
  answer: string;
  timestamp?: string;
}

export interface Session {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  transcript?: string;
  conversations?: Conversation[] | string;
  meeting_minutes?: string;
  meetingMinutes?: string;
  recap?: string;
  user_todos?: Todo[];
  userTodos?: Todo[];
  topic?: Topic;
}

export interface Highlight {
  id: string;
  sessionId: string;
  timestamp?: string;
  title?: string;
  rawQuote?: string;
  cleanedQuote?: string;
  mainIdea?: string;
  aiInsights?: string;
}

export interface TodoExportedPayload {
  id: string;
  sessionId: string;
  text: string;
  dueDate?: string;
}

export interface PaginationInfo {
  hasMore: boolean;
  next?: string;
  previous?: string;
}

export interface PaginatedResponse<T> {
  success?: boolean;
  data: T[];
  pagination?: PaginationInfo;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorPayload {
  success?: false;
  error: {
    code: string;
    message: string;
  };
}

export type HedyResponse<T> =
  | T
  | T[]
  | PaginatedResponse<T>
  | ApiSuccessResponse<T>
  | ApiErrorPayload;

export interface WebhookRegistration {
  id?: string;
  url: string;
  events: string[];
  signingSecret?: string;
  createdAt?: string;
  updatedAt?: string;
  enabled?: boolean;
}

export enum HedyWebhookEvent {
  SessionCreated = 'session.created',
  SessionEnded = 'session.ended',
  HighlightCreated = 'highlight.created',
  TodoExported = 'todo.exported',
}
