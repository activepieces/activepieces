import z from 'zod';

export const addLead = {
  campaign_id: z.number().int().positive(),
  phone_number: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g. +1234567890)'),
  variable: z.record(z.string(), z.any()).optional(),
  allow_dupplicate: z.boolean().optional(),
  secondary_contacts: z.array(z.object({
    phone_number: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format'),
    variables: z.record(z.string(), z.any()).optional(),
  })).optional(),
};

export const sendSms = {
  from: z.number().int().positive('Phone number ID is required'),
  to: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g. +1234567890)'),
  bodysuit: z.string().max(300, 'Message must be 300 characters or less'),
};

export const makePhoneCall = {
  assistant_id: z.number().int().positive(),
  phone_number: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g. +1234567890)'),
  variable: z.object({
    customer_name: z.string().optional(),
    email: z.string().email().optional(),
  }).catchall(z.any()).optional(),
};

export const campaignControl = {
  campaign_id: z.number().int().positive(),
  action: z.enum(['start', 'stop']),
};

export const deleteLead = {
  lead_id: z.number().int().positive('Lead ID must be a positive integer'),
};

export const getCurrentUser = {};

export const generateAiReply = {
  assistant_id: z.number().int().positive('Assistant ID must be a positive integer'),
  customer_identifier: z.string().max(255, 'Customer identifier must be 255 characters or less'),
  message: z.string().min(1, 'Message is required'),
  variables: z.record(z.string(), z.any()).optional(),
};

export const createConversation = {
  assistant_id: z.string().uuid('Assistant ID must be a valid UUID'),
  type: z.enum(['widget', 'test']).optional().default('widget'),
  variables: z.record(z.string(), z.any()).optional(),
};

export const getConversation = {
  uuid: z.string().uuid('Conversation UUID must be a valid UUID'),
};

export const sendMessage = {
  uuid: z.string().uuid('Conversation UUID must be a valid UUID'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message must be 2000 characters or less'),
};
