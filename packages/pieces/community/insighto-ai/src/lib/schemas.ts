import { z } from 'zod';

// Conversation schema for new-conversation trigger
export const ConversationItemSchema = z.object({
  id: z.string(),
  widget_id: z.string(),
  assistant_id: z.string(),
  assistant_name: z.string().optional(),
  attributes: z.string().optional(),
  first_message: z.string().optional(),
  device_type: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  chat_count: z.number(),
  includes_voice: z.boolean(),
  intent_name: z.string().optional(),
  contact_id: z.string(),
  contact_first_name: z.string().optional(),
  contact_last_name: z.string().optional(),
  summary: z.string().optional(),
  widget_type: z.string().optional(),
  widget_provider: z.string().optional(),
});

export type ConversationItem = z.infer<typeof ConversationItemSchema>;

// Contact schema for new-contact trigger
export const ContactItemSchema = z.object({
  id: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().optional(),
  channels: z.record(z.any()).optional(),
  user_attributes: z.record(z.any()).optional(),
  last_seen: z.string().optional(),
  last_sent: z.string().optional(),
  org_id: z.string().optional(),
  first_assistant_id: z.string().optional(),
  last_assistant_id: z.string().optional(),
  first_widget_id: z.string().optional(),
  last_widget_id: z.string().optional(),
  custom_fields: z.record(z.any()).optional(),
  created_at: z.string(),
});

export type ContactItem = z.infer<typeof ContactItemSchema>;

// Form schema for new-captured-form trigger
export const FormItemSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone_number: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
}).catchall(z.any()); // Allow additional properties

export type FormItem = z.infer<typeof FormItemSchema>;

// Webhook payload schema for captured_form.created event
export const CapturedFormWebhookSchema = z.object({
  id: z.string().uuid(),
  object: z.literal("event"),
  event: z.literal("captured_form.created"),
  created_at: z.string(),
  data: z.object({
    captured_form_id: z.string().uuid(),
    form_id: z.string().uuid(),
    conversation_id: z.string().uuid(),
    widget_id: z.string().uuid(),
    assistant_id: z.string().uuid(),
    form_name: z.string(),
    field_values: z.record(z.any()),
    attributes: z.record(z.any()),
  }),
});

export type CapturedFormWebhook = z.infer<typeof CapturedFormWebhookSchema>;

// Webhook payload schema for conversation.updated event
export const ConversationWebhookSchema = z.object({
  id: z.string().uuid(),
  object: z.literal("event"),
  event: z.literal("conversation.updated"),
  created_at: z.string(),
  data: z.object({
    conversation_id: z.string().uuid(),
    widget_id: z.string().uuid(),
    assistant_id: z.string().uuid(),
    device_type: z.enum(["mobile", "native", "desktop", "tablet", "phone"]),
    contact_id: z.string().uuid(),
    chat_count: z.number(),
    transcript: z.array(z.object({
      conversation_id: z.string().uuid().nullable(),
      sender_type: z.enum(["bot", "agent", "user", "tool"]).nullable(),
      message_type: z.enum(["voice", "text"]).nullable(),
      text: z.string(),
      voice_base64: z.string().nullable(),
      data_sources: z.array(z.any()).nullable(),
      id: z.string().uuid(),
      updated_at: z.string().nullable(),
      created_at: z.string().nullable(),
      char_count: z.number().nullable(),
    })),
    attributes: z.record(z.any()),
  }),
});

export type ConversationWebhook = z.infer<typeof ConversationWebhookSchema>;

// Assistant schema for dropdown options
export const AssistantItemSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  assistant_type: z.string(),
  llm_model: z.string(),
});

export type AssistantItem = z.infer<typeof AssistantItemSchema>;

// Widget schema for dropdown options
export const WidgetItemSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  display_name: z.string().optional(),
  widget_type: z.string(),
  widget_provider: z.string().optional(),
});

export type WidgetItem = z.infer<typeof WidgetItemSchema>;

// Data source schema for dropdown options
export const DataSourceItemSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  ds_type: z.string(),
});

export type DataSourceItem = z.infer<typeof DataSourceItemSchema>;

// API Response wrapper schema
export const ApiResponseSchema = z.object({
  data: z.object({
    items: z.array(z.any()),
  }).optional(),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;
