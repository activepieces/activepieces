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
