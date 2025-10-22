// Base Interfaces
export interface AuthenticationParams {
  apiKey: string;
}

export interface BaseStatusResponse {
  status: string;
  message?: string; // Optional message field for error descriptions
}

export interface BaseMessageUidResponse extends BaseStatusResponse {
  data: {
    message_uid: string;
  };
}

interface GroupMember {
  name: string;
  phone: string;
  role: string;
  chat_id: number;
}

interface Chat {
  id: string;
  name: string;
  phone: string;
  jid: string;
  is_group: boolean;
  closed: boolean;
  read: boolean;
  labels: string[];
  chatgpt_autoresponse_enabled: boolean;
  responsible_email: string;
  responsible_name: string;
  whatsapp_account_id: string;
  chat_url: string;
  created_timestamp: string;
  last_message_uid: string;
  last_message_timestamp: string;
  unattended: boolean;
  photo: string;
  group_members: GroupMember[];
  is_allowed_to_message: boolean;
}

interface Message {
  uid: string;
  chat_id: string;
  timestamp: string;
  sender_phone: string;
  sender_name: string;
  recipient_phone: string;
  recipient_name: string;
  from_me: boolean;
  text: string;
  attachment_url: string;
  attachment_filename: string;
  status: string;
  origin: string;
  has_attachment: boolean;
  message_type: string;
  reactions: Record<string, string>;
  data: Record<string, string>;
  created_by: string;
}

interface UploadedFile {
  temporary_download_url: string;
  uid: string;
  filename: string;
  size: number;
  mimetype: string;
  uploaded_by_email: string;
  uploaded_at: string;
}

interface WhatsAppAccount {
  id: string;
  phone: string;
  connected_on: string;
  status: string;
  owner_name: string;
  owner_email: string;
  account_name: string;
  is_visible: boolean;
}

export interface WebhookInformation {
  webhook_id: number;
}
// API Interfaces
export interface SendMessageToExistingChatParams extends AuthenticationParams {
  chat_id: number;
  text?: string;
  file_uid?: string;
  label?: string;
  chat_name?: string;
  attachment_template_id?: number;
}

export type SendMessageToExistingChatResponse = BaseMessageUidResponse;

export interface SendMessageToPhoneNumberParams extends AuthenticationParams {
  phone: string;
  text?: string;
  whatsapp_account_phone?: string;
  file_uid?: string;
  label?: string;
  chat_name?: string;
  attachment_template_id?: number;
}

export type SendMessageToPhoneNumberResponse = BaseMessageUidResponse;

export interface SendMessageToJidParams extends AuthenticationParams {
  jid: string;
  text?: string;
  whatsapp_account_phone?: string;
  file_uid?: string;
  label?: string;
  chat_name?: string;
  attachment_template_id?: number;
}

export type SendMessageToJidResponse = BaseMessageUidResponse;

export interface UpdateChatParams extends AuthenticationParams {
  chat_id: number;
  name?: string;
  responsible?: string;
  closed?: boolean;
  read?: boolean;
  chatgpt_autoresponse_enabled?: boolean;
}

export interface UpdateChatResponse extends BaseStatusResponse {
  data: Chat;
}

export interface GetChatsParams extends AuthenticationParams {
  label?: string;
  whatsapp_account_id?: string;
  group?: boolean;
  responsible?: string;
  name?: string;
  read?: boolean;
  closed?: boolean;
  chatgpt_autoresponse_enabled?: boolean;
  page?: number;
  created_after?: string;
  created_before?: string;
}

export interface GetChatsResponse extends BaseStatusResponse {
  data: {
    has_more_pages: number;
    chats: Chat[];
  };
}

export interface GetMessageParams extends AuthenticationParams {
  message_uid: string;
}

export interface GetMessageResponse extends BaseStatusResponse {
  data: Message;
}

export interface GetUploadedFileParams extends AuthenticationParams {
  file_uid: string;
}

export interface GetUploadedFileResponse extends BaseStatusResponse {
  data: UploadedFile;
}

export interface ListUploadedFilesParams extends AuthenticationParams {
  filename?: string;
}

export interface ListUploadedFilesResponse extends BaseStatusResponse {
  data: UploadedFile[];
}

export interface GetWhatsappAccountsResponse extends BaseStatusResponse {
  data: {
    whatsapp_accounts: WhatsAppAccount[];
  };
}

export interface UploadFileParams extends AuthenticationParams {
  file: Buffer;
  filename?: string;
  content_type?: string;
}

export interface UploadFileResponse extends BaseStatusResponse {
  data: UploadedFile;
}

export interface CreateWebhookParams extends AuthenticationParams {
  event_type:
    | 'message:new'
    | 'message:sent:new'
    | 'message:received:new'
    | 'whatsapp:account:connected'
    | 'whatsapp:account:disconnected'
    | 'whatsapp:account:suspended'
    | 'whatsapp:account:resumed'
    | 'chat:new'
    | 'chat:incoming:new'
    | 'chat:outgoing:new'
    | 'chat:responsible:assigned'
    | 'chat:responsible:unassigned';
  enabled?: boolean;
  url: string;
}

export interface CreateWebhookResponse extends BaseStatusResponse {
  status: string;
  data: {
    id: number;
    event_type: string;
    enabled: boolean;
    url: string;
    errors_counter: number;
  };
}

export interface DeleteWebhookParams extends AuthenticationParams {
  webhook_id: number;
}

export interface DeleteWebhookResponse {
  message?: string;
  status?: string;
}

