import { z } from 'zod';

export const CreateChatbotDto = z.object({
  name: z.string(),
  description: z.string().optional(),
  language: z.string().optional(),
  basePrompt: z.string().optional(),
});

export const SendMessageDto = z.object({
  conversationId: z.string().optional(),
  sender: z.enum(['user', 'bot', 'system']),
  text: z.string(),
  metadata: z.record(z.any()).optional(),
});

export const RetrainOptions = z.object({
  trainingSettings: z.record(z.any()).optional(),
});

export const Chatbot = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  language: z.string().optional(),
  basePrompt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const Message = z.object({
  id: z.string(),
  chatbotId: z.string(),
  conversationId: z.string(),
  sender: z.enum(['user', 'bot', 'system']),
  text: z.string(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.string(),
});

export const RetrainJob = z.object({
  id: z.string(),
  chatbotId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  createdAt: z.string(),
});

export const RetrainJobStatus = z.object({
  id: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  progress: z.number().optional(),
  error: z.string().optional(),
});

export const FileMeta = z.object({
  id: z.string(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
});

export const WebhookSubscription = z.object({
  id: z.string(),
  chatbotId: z.string(),
  callbackUrl: z.string(),
  events: z.array(z.string()),
  createdAt: z.string(),
});

export const EventList = z.object({
  events: z.array(z.object({
    id: z.string(),
    type: z.string(),
    chatbotId: z.string(),
    data: z.record(z.any()),
    timestamp: z.string(),
  })),
  page: z.number(),
  totalPages: z.number(),
  totalCount: z.number(),
});

export type CreateChatbotDto = z.infer<typeof CreateChatbotDto>;
export type SendMessageDto = z.infer<typeof SendMessageDto>;
export type RetrainOptions = z.infer<typeof RetrainOptions>;
export type Chatbot = z.infer<typeof Chatbot>;
export type Message = z.infer<typeof Message>;
export type RetrainJob = z.infer<typeof RetrainJob>;
export type RetrainJobStatus = z.infer<typeof RetrainJobStatus>;
export type FileMeta = z.infer<typeof FileMeta>;
export type WebhookSubscription = z.infer<typeof WebhookSubscription>;
export type EventList = z.infer<typeof EventList>;