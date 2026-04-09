import z from 'zod';

const e164Phone = z
  .string()
  .regex(
    /^\+[1-9]\d{1,14}$/,
    'Phone number must be in E.164 format (e.g. +1234567890)',
  );

export const addLead = {
  campaign: z.number().int().positive(),
  phone_number: e164Phone,
  variables: z.record(z.string(), z.unknown()).optional(),
  allow_dupplicate: z.boolean().optional(),
  num_secondary_contacts: z.number().int().min(0).max(10).optional(),
  secondary_contacts: z
    .record(z.string(), z.unknown())
    .optional()
    .superRefine(
      (data: Record<string, unknown> | undefined, ctx: z.RefinementCtx) => {
        if (data === undefined) {
          return;
        }
        for (const [key, value] of Object.entries(data)) {
          if (!/^contact_\d+_phone$/.test(key)) {
            continue;
          }
          if (typeof value !== 'string' || value.trim() === '') {
            continue;
          }
          const trimmed = value.trim();
          const result = e164Phone.safeParse(trimmed);
          if (!result.success) {
            ctx.addIssue({
              code: 'custom',
              message:
                result.error.issues[0]?.message ?? 'Invalid phone number',
              path: [key],
            });
          }
        }
      },
    ),
};

export const sendSms = {
  from: z.number().int().positive('Phone number ID is required'),
  to: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      'Phone number must be in E.164 format (e.g. +1234567890)',
    ),
  bodysuit: z.string().max(300, 'Message must be 300 characters or less'),
};

export const makePhoneCall = {
  assistant_id: z.number().int().positive(),
  phone_number: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      'Phone number must be in E.164 format (e.g. +1234567890)',
    ),
  variable: z
    .object({
      customer_name: z.string().optional(),
      email: z.string().email().optional(),
    })
    .catchall(z.unknown())
    .optional(),
};

export const campaignControl = {
  campaign_id: z.number().int().positive(),
  action: z.enum(['start', 'stop']),
};

const campaignWeekday = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

export const createCampaign = {
  name: z.string().min(1).max(255),
  assistant_id: z.number().int().positive(),
  timezone: z.string().optional(),
  max_calls_in_parallel: z.number().int().min(1).max(10).optional(),
  allowed_hours_start_time: z
    .union([
      z.literal(''),
      z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be H:i (e.g. 09:00)'),
    ])
    .optional(),
  allowed_hours_end_time: z
    .union([
      z.literal(''),
      z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be H:i (e.g. 17:00)'),
    ])
    .optional(),
  allowed_days: z.array(campaignWeekday).optional(),
  max_retries: z.number().int().min(1).max(5).optional(),
  retry_interval: z.number().int().min(10).max(4320).optional(),
  retry_on_voicemail: z.boolean().optional(),
  retry_on_goal_incomplete: z.boolean().optional(),
  goal_completion_variable: z.string().max(255).optional(),
  mark_complete_when_no_leads: z.boolean().optional(),
  phone_number_ids: z.array(z.number().int().positive()).optional(),
};

export const deleteLead = {
  lead_id: z.number().int().positive('Lead ID must be a positive integer'),
};

export const updateLead = {
  lead_id: z.number().int().positive('Lead ID must be a positive integer'),
  campaign: z.number().int().positive().optional(),
  phone_number: z
    .union([
      z
        .string()
        .regex(
          /^\+[1-9]\d{1,14}$/,
          'Phone number must be in E.164 format (e.g. +1234567890)',
        ),
      z.literal(''),
    ])
    .optional(),
  status: z.enum(['created', 'completed', 'reached-max-retries']).optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
};

export const getCurrentUser = {};

export const listLeads = {};

export const listAccountPhoneNumbers = {};

const supportedPurchaseCountryCodes = z.enum([
  'DE',
  'US',
  'CA',
  'GB',
  'AU',
  'IL',
  'PL',
  'FI',
  'NL',
  'DK',
  'IT',
]);

export const searchAvailablePhoneNumbers = {
  country_code: supportedPurchaseCountryCodes,
  contains: z
    .union([
      z.literal(''),
      z.string().regex(/^\d{1,10}$/, 'Use at most 10 numeric digits'),
    ])
    .optional(),
};

export const purchasePhoneNumber = {
  phone_number: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      'Phone number must be in E.164 format (e.g. +1234567890)',
    ),
};

export const generateAiReply = {
  assistant_id: z
    .number()
    .int()
    .positive('Assistant ID must be a positive integer'),
  customer_identifier: z
    .string()
    .min(1, 'Customer identifier is required')
    .max(255, 'Customer identifier must be 255 characters or less'),
  message: z.string().min(1, 'Message is required'),
  variables: z.record(z.string(), z.unknown()).optional(),
};

export const createConversation = {
  assistant_id: z.string().uuid('Assistant ID must be a valid UUID'),
  type: z.enum(['widget', 'test']).optional().default('widget'),
  variables: z.record(z.string(), z.unknown()).optional(),
};

export const getConversation = {
  uuid: z.string().uuid('Conversation UUID must be a valid UUID'),
};

export const sendMessage = {
  uuid: z.string().uuid('Conversation UUID must be a valid UUID'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message must be 2000 characters or less'),
};

export const listConversations = {
  type: z.enum(['test', 'widget', 'whatsapp', 'api']).optional(),
  assistant_id: z.number().int().positive().optional(),
  customer_phone: z.string().optional(),
  whatsapp_sender_phone: z.string().optional(),
  external_identifier: z.string().optional(),
  per_page: z.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
};

const callStatusFilter = z.enum([
  'initiated',
  'ringing',
  'busy',
  'in-progress',
  'ended',
  'completed',
  'ended_by_customer',
  'ended_by_assistant',
  'no-answer',
  'failed',
]);

const callDirectionType = z.enum(['inbound', 'outbound', 'web']);

const yyyyMmDd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

export const listCalls = {
  status: callStatusFilter.optional(),
  type: callDirectionType.optional(),
  phone_number: z.string().optional(),
  assistant_id: z.number().int().positive().optional(),
  campaign_id: z.number().int().positive().optional(),
  date_from: z.union([z.literal(''), yyyyMmDd]).optional(),
  date_to: z.union([z.literal(''), yyyyMmDd]).optional(),
  per_page: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
};

export const getCall = {
  call_id: z.number().int().positive('Call ID must be a positive integer'),
};

export const deleteCall = {
  call_id: z.number().int().positive('Call ID must be a positive integer'),
};

export const getWhatsAppSenders = {
  status: z.enum(['online', 'all']).optional(),
};

export const getWhatsAppTemplates = {
  sender_id: z.number().int().positive('Sender ID must be a positive integer'),
  status: z.enum(['approved', 'all']).optional(),
};

export const sendWhatsAppTemplate = {
  sender_id: z.number().int().positive(),
  template_id: z.number().int().positive(),
  recipient_phone: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      'Phone number must be in E.164 format (e.g. +1234567890)',
    ),
  recipient_name: z.string().max(255).optional(),
  variables: z.record(z.string(), z.string()).optional(),
};

export const sendWhatsAppFreeform = {
  sender_id: z.number().int().positive(),
  recipient_phone: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      'Phone number must be in E.164 format (e.g. +1234567890)',
    ),
  message: z
    .string()
    .max(4096, 'Message must be 4096 characters or less')
    .refine((s: string) => s.trim().length > 0, 'Message is required'),
};

export const getWhatsAppSessionStatus = {
  sender_id: z.number().int().positive(),
  recipient_phone: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      'Phone number must be in E.164 format (e.g. +1234567890)',
    ),
};
