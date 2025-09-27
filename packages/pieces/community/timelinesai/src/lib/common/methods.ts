import { timelinesaiCommon } from './client';
import { TimelinesaiAuth } from './auth';

// Action implementations
export const sendMessageToExistingChat = async ({
  apiKey,
  chat_id,
  message,
  message_type = 'text',
}: {
  apiKey: string;
  chat_id: string;
  message: string;
  message_type?: string;
}) => {
  const auth: TimelinesaiAuth = { api_key: apiKey };
  return timelinesaiCommon.sendMessageToExistingChat({
    auth,
    chatId: chat_id,
    message,
    messageType: message_type,
  });
};

export const sendFileToExistingChat = async ({
  apiKey,
  chat_id,
  file_url,
  file,
  filename,
  caption,
}: {
  apiKey: string;
  chat_id: string;
  file_url?: string;
  file?: any;
  filename?: string;
  caption?: string;
}) => {
  const auth: TimelinesaiAuth = { api_key: apiKey };
  const fileData: any = {};

  if (file_url) fileData.file_url = file_url;
  if (file) fileData.file = file;
  if (filename) fileData.filename = filename;
  if (caption) fileData.caption = caption;

  return timelinesaiCommon.sendFileToExistingChat({
    auth,
    chatId: chat_id,
    ...fileData,
  });
};

export const sendUploadedFileToExistingChat = async ({
  apiKey,
  chat_id,
  file_id,
  filename,
  caption,
}: {
  apiKey: string;
  chat_id: string;
  file_id: string;
  filename?: string;
  caption?: string;
}) => {
  const auth: TimelinesaiAuth = { api_key: apiKey };
  const fileData: any = {
    file_id,
  };

  if (filename) fileData.filename = filename;
  if (caption) fileData.caption = caption;

  return timelinesaiCommon.sendFileToExistingChat({
    auth,
    chatId: chat_id,
    ...fileData,
  });
};

export const sendMessageToNewChat = async ({
  apiKey,
  whatsapp_account_id,
  phone_number,
  message,
  message_type = 'text',
}: {
  apiKey: string;
  whatsapp_account_id: string;
  phone_number: string;
  message: string;
  message_type?: string;
}) => {
  const auth: TimelinesaiAuth = { api_key: apiKey };
  return timelinesaiCommon.sendMessageToNewChat({
    auth,
    whatsappAccountId: whatsapp_account_id,
    phoneNumber: phone_number,
    message,
    messageType: message_type,
  });
};

export const closeChat = async ({
  apiKey,
  chat_id,
}: {
  apiKey: string;
  chat_id: string;
}) => {
  const auth: TimelinesaiAuth = { api_key: apiKey };
  return timelinesaiCommon.closeChatById({
    auth,
    chatId: chat_id,
  });
};

// Search implementations
export const findChat = async ({
  apiKey,
  chat_id,
  whatsapp_account_id,
  phone_number,
  name,
  status,
  limit = 50,
  offset = 0,
}: {
  apiKey: string;
  chat_id?: string;
  whatsapp_account_id?: string;
  phone_number?: string;
  name?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  const auth: TimelinesaiAuth = { api_key: apiKey };

  if (chat_id) {
    return timelinesaiCommon.findChatById({
      auth,
      chatId: chat_id,
    });
  }

  return timelinesaiCommon.findChatsByCriteria({
    auth,
    limit,
    offset,
    whatsapp_account_id,
    status,
  });
};

export const findMessage = async ({
  apiKey,
  message_id,
}: {
  apiKey: string;
  message_id: string;
}) => {
  const auth: TimelinesaiAuth = { api_key: apiKey };
  return timelinesaiCommon.findMessageById({
    auth,
    messageId: message_id,
  });
};

export const findUploadedFile = async ({
  apiKey,
  file_id,
  filename,
  chat_id,
  limit = 50,
  offset = 0,
}: {
  apiKey: string;
  file_id?: string;
  filename?: string;
  chat_id?: string;
  limit?: number;
  offset?: number;
}) => {
  const auth: TimelinesaiAuth = { api_key: apiKey };

  if (file_id) {
    return timelinesaiCommon.findFileById({
      auth,
      fileId: file_id,
    });
  }

  if (!chat_id) {
    throw new Error('chat_id is required when searching for files');
  }

  return timelinesaiCommon.findFilesByCriteria({
    auth,
    chatId: chat_id,
    limit,
    offset,
  });
};

export const findMessageStatus = async ({
  apiKey,
  message_id,
}: {
  apiKey: string;
  message_id: string;
}) => {
  const auth: TimelinesaiAuth = { api_key: apiKey };
  return timelinesaiCommon.findMessageStatusById({
    auth,
    messageId: message_id,
  });
};

export const findWhatsAppAccount = async ({
  apiKey,
  whatsapp_account_id,
  phone_number,
}: {
  apiKey: string;
  whatsapp_account_id?: string;
  phone_number?: string;
}) => {
  const auth: TimelinesaiAuth = { api_key: apiKey };

  if (whatsapp_account_id) {
    return timelinesaiCommon.getWhatsAppAccount({
      auth,
      accountId: whatsapp_account_id,
    });
  }

  return timelinesaiCommon.findWhatsAppAccountsByCriteria({
    auth,
    phone_number,
  });
};
