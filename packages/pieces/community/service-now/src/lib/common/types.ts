import { z } from 'zod';

export const ServiceNowRecordSchema = z.record(z.string(), z.any());
export type ServiceNowRecord = z.infer<typeof ServiceNowRecordSchema>;

export const AttachmentMetaSchema = z.object({
  sys_id: z.string(),
  file_name: z.string(),
  content_type: z.string(),
  size_bytes: z.string(),
  table_name: z.string(),
  table_sys_id: z.string(),
  download_link: z.string(),
  average_image_color: z.string().optional(),
  compressed: z.string().optional(),
  created_by_name: z.string().optional(),
  image_height: z.string().optional(),
  image_width: z.string().optional(),
  size_compressed: z.string().optional(),
  sys_created_by: z.string().optional(),
  sys_created_on: z.string().optional(),
  sys_mod_count: z.string().optional(),
  sys_tags: z.string().optional(),
  sys_updated_by: z.string().optional(),
  sys_updated_on: z.string().optional(),
  updated_by_name: z.string().optional(),
});
export type AttachmentMeta = z.infer<typeof AttachmentMetaSchema>;

export const TriggerEventSchema = z.object({
  eventId: z.string(),
  table: z.string(),
  sys_id: z.string(),
  operation: z.enum(['create', 'update', 'delete']),
  fields: z.record(z.string(), z.any()),
  timestamp: z.string(),
  raw: z.record(z.string(), z.any()),
});
export type TriggerEvent = z.infer<typeof TriggerEventSchema>;

export const EventListSchema = z.object({
  events: z.array(TriggerEventSchema),
  hasMore: z.boolean(),
  nextCursor: z.string().optional(),
});
export type EventList = z.infer<typeof EventListSchema>;

export const WebhookSubscriptionSchema = z.object({
  id: z.string(),
  table: z.string(),
  callbackUrl: z.string(),
  events: z.array(z.string()),
  active: z.boolean(),
});
export type WebhookSubscription = z.infer<typeof WebhookSubscriptionSchema>;

export const CatalogItemSchema = z.object({
  sys_id: z.string(),
  name: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  recurring_price: z.string().optional(),
  picture: z.string().optional(),
}).passthrough();
export type CatalogItem = z.infer<typeof CatalogItemSchema>;

export const CatalogOrderResultSchema = z.object({
  sys_id: z.string().optional(),
  request_number: z.string().optional(),
  request_id: z.string().optional(),
  table: z.string().optional(),
}).passthrough();
export type CatalogOrderResult = z.infer<typeof CatalogOrderResultSchema>;

export const JournalEntrySchema = z.object({
  sys_id: z.string(),
  element: z.string(),
  element_id: z.string(),
  name: z.string().optional(),
  value: z.string().optional(),
  sys_created_by: z.string().optional(),
  sys_created_on: z.string().optional(),
}).passthrough();
export type JournalEntry = z.infer<typeof JournalEntrySchema>;

export const KnowledgeArticleSchema = z.object({
  sys_id: z.string().optional(),
  number: z.string().optional(),
  short_description: z.string().optional(),
  title: z.string().optional(),
  workflow_state: z.string().optional(),
  content: z.string().optional(),
  text: z.string().optional(),
  link: z.string().optional(),
  kb_knowledge_base: z
    .union([z.string(), z.record(z.string(), z.any())])
    .optional(),
  kb_category: z
    .union([z.string(), z.record(z.string(), z.any())])
    .optional(),
}).passthrough();
export type KnowledgeArticle = z.infer<typeof KnowledgeArticleSchema>;

export const KnowledgeSearchResultSchema = z.object({
  meta: z.record(z.string(), z.any()).optional(),
  result: z.object({
    meta: z.record(z.string(), z.any()).optional(),
    articles: z.array(KnowledgeArticleSchema).default([]),
  }),
}).passthrough();
export type KnowledgeSearchResult = z.infer<typeof KnowledgeSearchResultSchema>;

export const EmailSendResultSchema = z.object({
  sys_id: z.string().optional(),
  status: z.string().optional(),
}).passthrough();
export type EmailSendResult = z.infer<typeof EmailSendResultSchema>;

export class NotSupported extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotSupported';
  }
}

export interface AuthConfig {
  type: 'basic' | 'bearer';
  username?: string;
  password?: string;
  token?: string;
}

export interface ServiceNowClientOptions {
  instanceUrl: string;
  auth: AuthConfig;
  apiVersion?: string;
}