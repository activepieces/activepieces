import z from 'zod';

export const sendMessageToExistingChat = {
  chat_id: z.string().min(1),
  message: z.string().min(1),
  message_type: z.enum(['text', 'image', 'video', 'audio', 'document', 'location', 'contact']).optional().default('text'),
};

export const sendFileToExistingChat = {
  chat_id: z.string().min(1),
  file_url: z.string().url().optional(),
  file: z.any().optional(),
  filename: z.string().optional(),
  caption: z.string().optional(),
};

export const sendUploadedFileToExistingChat = {
  chat_id: z.string().min(1),
  file_id: z.string().min(1),
  filename: z.string().optional(),
  caption: z.string().optional(),
};

export const sendMessageToNewChat = {
  whatsapp_account_id: z.string().min(1),
  phone_number: z.string().regex(/^\+\d{1,4}\d{6,14}$/, 'Phone number must be in international format (e.g., +1234567890)'),
  message: z.string().min(1),
  message_type: z.enum(['text', 'image', 'video', 'audio', 'document', 'location', 'contact']).optional().default('text'),
};

export const closeChat = {
  chat_id: z.string().min(1),
};

export const findChat = {
  chat_id: z.string().optional(),
  whatsapp_account_id: z.string().optional(),
  phone_number: z.string().regex(/^\+\d{1,4}\d{6,14}$/, 'Phone number must be in international format').optional(),
  name: z.string().optional(),
  status: z.enum(['open', 'closed', 'archived']).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
};

export const findMessage = {
  message_id: z.string().min(1),
};

export const findUploadedFile = {
  file_id: z.string().optional(),
  filename: z.string().optional(),
  chat_id: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
};

export const findMessageStatus = {
  message_id: z.string().min(1),
};

export const findWhatsAppAccount = {
  whatsapp_account_id: z.string().optional(),
  phone_number: z.string().regex(/^\+\d{1,4}\d{6,14}$/, 'Phone number must be in international format').optional(),
};

export const newIncomingChat = {
  whatsapp_account_id: z.string().optional(),
};

export const newOutgoingChat = {
  whatsapp_account_id: z.string().optional(),
};

export const chatClosed = {
  whatsapp_account_id: z.string().optional(),
};

export const newSentMessage = {
  whatsapp_account_id: z.string().optional(),
  chat_id: z.string().optional(),
};

export const newReceivedMessage = {
  whatsapp_account_id: z.string().optional(),
  chat_id: z.string().optional(),
};

export const newUploadedFile = {
  whatsapp_account_id: z.string().optional(),
  chat_id: z.string().optional(),
};

export const chatRenamed = {
  whatsapp_account_id: z.string().optional(),
};

export const newWhatsAppAccount = {};
