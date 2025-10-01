import { z } from 'zod';

export const CreateChatbotDto = z.object({
  chatbotName: z.string(),
  sourceText: z.string().optional(),
  urlsToScrape: z.array(z.string()).optional(),
  products: z.array(z.object({
    id: z.string(),
    information: z.record(z.any()),
  })).optional(),
  qAndAs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
  customBackend: z.string().optional(),
  bearer: z.string().optional(),
  model: z.enum(['custom-data-upload', 'medical-chat-human', 'medical-chat-vet', 'custom-model']).default('custom-data-upload'),
});

export const SendMessageDto = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    files: z.array(z.object({
      name: z.string(),
      type: z.enum(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/html', 'text/plain', 'image/png', 'image/jpg', 'image/jpeg', 'image/webp']),
      url: z.string().url(),
      content: z.string().optional(),
    })).max(3).optional(),
  })),
  chatbotId: z.string(),
  includeReasoning: z.boolean().optional(),
  baseModel: z.enum(['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-5-nano', 'gpt-5-mini', 'gpt-5', 'gpt-o1', 'gpt-o3-mini', 'gpt-o3', 'gpt-o4-mini', 'claude-3-5-sonnet', 'claude-3-7-sonnet', 'claude-4-sonnet', 'claude-4-5-sonnet', 'claude-3-5-haiku', 'claude-3-haiku', 'claude-4-opus', 'claude-4.1-opus', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro', 'deepseek-r1']).optional(),
  basePrompt: z.string().optional(),
  stream: z.boolean().default(false),
  openAIFormat: z.boolean().default(false),
  appendMessages: z.boolean().default(false),
  conversationId: z.string().optional(),
});

export const RetrainOptions = z.object({
  chatbotId: z.string(),
  sourceText: z.string().optional(),
  urlsToScrape: z.array(z.string()).optional(),
  options: z.object({
    Cookies: z.string().optional(),
    extractMainContent: z.boolean().optional(),
    includeOnlyTags: z.string().optional(),
    excludeTags: z.string().optional(),
  }).optional(),
  products: z.array(z.object({
    id: z.string(),
    information: z.record(z.any()),
  })).optional(),
  qAndAs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
  deletes: z.array(z.object({
    type: z.enum(['website', 'q&a', 'product', 'text', 'file']),
    url: z.string().optional(),
  })).optional(),
});

export const Chatbot = z.object({
  chatbotId: z.string(),
  consumedCharacters: z.number(),
  remainingCharacters: z.number(),
  dataSources: z.array(z.object({
    name: z.string(),
    characters: z.number(),
    type: z.string(),
  })),
  status: z.string(),
});

export const Message = z.object({
  response: z.string(),
  conversationId: z.string().optional(),
});

export const RetrainJob = z.object({
  chatbotId: z.string(),
  consumedCharacters: z.number(),
  remainingCharacters: z.number(),
  dataSources: z.array(z.object({
    name: z.string(),
    characters: z.number(),
    type: z.string(),
  })),
  status: z.string(),
});

export const RetrainJobStatus = z.object({
  id: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  progress: z.number().optional(),
  error: z.string().optional(),
});

export const FileMeta = z.object({
  status: z.string(),
  url: z.string(),
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

export const UpdateChatbotSettingsDto = z.object({
  chatbotId: z.string(),
  chatbotName: z.string().optional(),
  basePrompt: z.string().optional(),
  initialMessages: z.array(z.string()).optional(),
  suggestedMessages: z.array(z.string()).optional(),
  visibility: z.enum(['private', 'public']).optional(),
  onlyAllowOnAddedDomains: z.boolean().optional(),
  domains: z.array(z.string()).optional(),
  rateLimitPoints: z.number().optional(),
  rateLimitTimeframe: z.number().optional(),
  rateLimitMessage: z.string().optional(),
  baseModel: z.enum(['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-5-nano', 'gpt-5-mini', 'gpt-5', 'gpt-o1', 'gpt-o3-mini', 'gpt-o3', 'gpt-o4-mini', 'claude-3-5-sonnet', 'claude-3-7-sonnet', 'claude-4-sonnet', 'claude-4-5-sonnet', 'claude-3-5-haiku', 'claude-3-haiku', 'claude-4-opus', 'claude-4.1-opus', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro', 'deepseek-r1']).optional(),
  temperature: z.number().min(0).max(1).optional(),
  storeChat: z.boolean().optional(),
  trackIpAddress: z.boolean().optional(),
  showCalendar: z.boolean().optional(),
  calendarUrl: z.string().optional(),
  calendarMessage: z.string().optional(),
  enableBouncingAnimation: z.boolean().optional(),
  ignoreDataSource: z.boolean().optional(),
  customBackend: z.string().optional(),
  bearer: z.string().optional(),
});

export type UpdateChatbotSettingsDto = z.infer<typeof UpdateChatbotSettingsDto>;