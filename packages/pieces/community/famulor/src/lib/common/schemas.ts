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
