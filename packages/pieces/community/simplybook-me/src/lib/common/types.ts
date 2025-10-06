import { z } from 'zod';

// Base schemas
export const BookingSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  service_id: z.string(),
  provider_id: z.string(),
  start_date_time: z.string(),
  end_date_time: z.string(),
  status: z.string(),
  notes: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number(),
  price: z.number().optional(),
  description: z.string().optional(),
});

export const ProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
});

export const InvoiceSchema = z.object({
  id: z.string(),
  booking_id: z.string(),
  amount: z.number(),
  status: z.string(),
  created_at: z.string(),
});

export const EventSchema = z.object({
  id: z.string(),
  type: z.string(),
  object_id: z.string(),
  timestamp: z.string(),
  data: z.record(z.any()),
});

export const CommentSchema = z.object({
  id: z.string(),
  booking_id: z.string(),
  text: z.string(),
  created_at: z.string(),
});

export const NoteSchema = z.object({
  id: z.string(),
  text: z.string(),
  created_at: z.string(),
});

export const WebhookSubscriptionSchema = z.object({
  id: z.string(),
  callback_url: z.string(),
  events: z.array(z.string()),
  created_at: z.string(),
});

// DTO schemas for inputs
export const CreateBookingDtoSchema = z.object({
  client_id: z.string(),
  service_id: z.string(),
  provider_id: z.string(),
  start_date_time: z.string(),
  notes: z.string().optional(),
});

export const CreateClientDtoSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
});

export const NoteDtoSchema = z.object({
  text: z.string(),
});

// Query schemas
export const BookingQuerySchema = z.object({
  client_id: z.string().optional(),
  service_id: z.string().optional(),
  provider_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional(),
});

export const ClientQuerySchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export const InvoiceQuerySchema = z.object({
  booking_id: z.string().optional(),
  status: z.string().optional(),
});

export const ListParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const ReportParamsSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  type: z.string(),
});

// Result schemas
export const ListResultSchema = z.object({
  data: z.array(z.any()),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const ReportResultSchema = z.object({
  data: z.record(z.any()),
  generated_at: z.string(),
});

export const EventListSchema = z.object({
  events: z.array(EventSchema),
  total: z.number(),
  page: z.number(),
});

// TypeScript types
export type Booking = z.infer<typeof BookingSchema>;
export type Client = z.infer<typeof ClientSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type Provider = z.infer<typeof ProviderSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type WebhookSubscription = z.infer<typeof WebhookSubscriptionSchema>;

export type CreateBookingDto = z.infer<typeof CreateBookingDtoSchema>;
export type CreateClientDto = z.infer<typeof CreateClientDtoSchema>;
export type NoteDto = z.infer<typeof NoteDtoSchema>;

export type BookingQuery = z.infer<typeof BookingQuerySchema>;
export type ClientQuery = z.infer<typeof ClientQuerySchema>;
export type InvoiceQuery = z.infer<typeof InvoiceQuerySchema>;
export type ListParams = z.infer<typeof ListParamsSchema>;
export type ReportParams = z.infer<typeof ReportParamsSchema>;

export type ListResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type ReportResult = z.infer<typeof ReportResultSchema>;
export type EventList = z.infer<typeof EventListSchema>;

// Error types
export class SimplyBookError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'SimplyBookError';
  }
}

export class NotSupportedError extends Error {
  constructor(message: string = 'Feature not supported') {
    super(message);
    this.name = 'NotSupportedError';
  }
}
