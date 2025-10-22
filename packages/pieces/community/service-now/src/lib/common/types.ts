import { z } from 'zod';

export const ServiceNowRecordSchema = z.record(z.any());
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
  fields: z.record(z.any()),
  timestamp: z.string(),
  raw: z.record(z.any()),
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