export type TimelinesAiAuthType = string;

export type AnyWebhookPayload =
  | WebhookPayload
  | NewMessageWebhookPayload
  | NewFileWebhookPayload
  | NewAccountWebhookPayload;

export interface SendMessageRequest {
  text?: string;
  label?: string;
  file_uid?: string;
  attachment_template_id?: number;
}

export interface ResponsibleUser {
    id: string;
    email: string;
    name: string;
}

export interface Chat {
  id: number | string;
  name: string;
  previous_name?: string; 
  phone?: string;
  jid?: string;
  is_group?: boolean;
  closed?: boolean;
  read?: boolean;
  labels?: string[];
  responsible_email?: string;
  responsible_name?: string;
  whatsapp_account_id?: string;
  chat_url?: string;
  created_timestamp?: string;
  last_message_uid?: string;
  last_message_timestamp?: string;
  photo?: string;
  is_allowed_to_message?: boolean;
  whatsapp_account_phone?: string;
  responsible?: ResponsibleUser;
}

export interface FindChatRequest {
  phone?: string;
  name?: string;
  chat_id?: number;
  whatsapp_account_phone?: string;
  responsible_email?: string;
  label?: string;
}

export interface SendMessageResponse {
  status: string;
  data: {
    message_uid: string;
  };
}

export interface UploadFileByUrlRequest {
  download_url: string;
  filename?: string;
  content_type?: string;
}

export interface UploadFileResponse {
  status: string;
  data: {
    uid: string;
    filename: string;
    size: number;
    mimetype: string;
  };
}

export interface UploadFileByFormDataResponse {
  file_uid: string;
}

export interface WhatsAppAccount {
  id: string;
  phone: string;
  name: string;
  status?: string;
  is_active?: boolean;
}

export interface SendMessageToNewChatRequest {
    whatsapp_account_phone: string;
    phone: string;
    text: string;
    label?: string;
    file_uid?: string;
}

export interface UpdateChatRequest {
    state: 'closed' | 'open';
}

export interface UpdateChatResponse {
    status: string;
    data: {
        chat: Chat;
    };
}

export interface Message {
  uid: string;
  chat_id: number | string;
  text: string;
  is_outgoing?: boolean;
  is_read?: boolean;
  created_timestamp?: string;
  sender?: Sender;
  timestamp?: number;
}

export interface GetMessageResponse {
    status: string;
    data: Message;
}

export interface UploadedFile {
  uid: string;
  name: string;
  size: number;
  mimetype: string;
  url?: string;
  temporary_download_url?: string;
  uploaded_by_email?: string;
  uploaded_at?: string;
}

export interface GetFilesResponse {
    status: string;
    data: UploadedFile[];
}

export interface GetFileResponse {
    status: string;
    data: UploadedFile;
}

export interface FindFileRequest {
    filename?: string;
}

export interface MessageStatus {
    status: string;
    timestamp: string;
}

export interface WebhookPayload {
    event_type: string;
    timestamp: string;
    chat: Chat;
}

export interface Sender {
  name: string;
  is_me: boolean;
}

export interface NewMessageWebhookPayload {
  event_type: string;
  timestamp: string;
  message: Message;
  chat: Chat;
}

export interface NewFileWebhookPayload {
  event_type: string;
  timestamp: string;
  file: UploadedFile;
  chat: Chat;
}

export interface NewAccountWebhookPayload {
  event_type: string;
  timestamp: string;
  account: WhatsAppAccount;
}