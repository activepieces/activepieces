import { PieceAuth } from '@activepieces/pieces-framework';
import * as z from 'zod/mini'

export const CreateChatbotDto = z.object({
  chatbotName: z.string().check(z.minLength(1, 'Chatbot name is required')),
  sourceText: z.optional(z.string()),
  urlsToScrape: z.optional(z.array(z.string().check(z.url('Invalid URL format')))),
  products: z.optional(z.array(z.object({
    id: z.string().check(z.minLength(1, 'Product ID is required')),
    information: z.record(z.string(), z.unknown()),
  }))),
  qAndAs: z.optional(z.array(z.object({
    question: z.string().check(z.minLength(1, 'Question is required')),
    answer: z.string().check(z.minLength(1, 'Answer is required')),
  }))),
  customBackend: z.optional(z.string().check(z.url('Invalid backend URL'))),
  bearer: z.optional(z.string()),
  model: z._default(z.enum(['custom-data-upload', 'medical-chat-human', 'medical-chat-vet', 'custom-model']), 'custom-data-upload'),
});

export const SendMessageDto = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    files: z.optional(z.array(z.object({
      name: z.string(),
      type: z.enum(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/html', 'text/plain', 'image/png', 'image/jpg', 'image/jpeg', 'image/webp']),
      url: z.string().check(z.url()),
      content: z.optional(z.string()),
    })).check(z.maxLength(3))),
  })),
  chatbotId: z.string(),
  includeReasoning: z.optional(z.boolean()),
  baseModel: z.optional(z.enum(['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-5-nano', 'gpt-5-mini', 'gpt-5', 'gpt-o1', 'gpt-o3-mini', 'gpt-o3', 'gpt-o4-mini', 'claude-3-5-sonnet', 'claude-3-7-sonnet', 'claude-4-sonnet', 'claude-4-5-sonnet', 'claude-3-5-haiku', 'claude-3-haiku', 'claude-4-opus', 'claude-4.1-opus', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro', 'deepseek-r1'])),
  basePrompt: z.optional(z.string()),
  stream: z._default(z.boolean(), false),
  openAIFormat: z._default(z.boolean(), false),
  appendMessages: z._default(z.boolean(), false),
  conversationId: z.optional(z.string()),
});

export const RetrainOptions = z.object({
  chatbotId: z.string(),
  sourceText: z.optional(z.string()),
  urlsToScrape: z.optional(z.array(z.string())),
  options: z.optional(z.object({
    Cookies: z.optional(z.string()),
    extractMainContent: z.optional(z.boolean()),
    includeOnlyTags: z.optional(z.string()),
    excludeTags: z.optional(z.string()),
  })),
  products: z.optional(z.array(z.object({
    id: z.string(),
    information: z.record(z.string(), z.unknown()),
  }))),
  qAndAs: z.optional(z.array(z.object({
    question: z.string(),
    answer: z.string(),
  }))),
  deletes: z.optional(z.array(z.object({
    type: z.enum(['website', 'q&a', 'product', 'text', 'file']),
    url: z.optional(z.string()),
  }))),
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
  conversationId: z.optional(z.string()),
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
  progress: z.optional(z.number()),
  error: z.optional(z.string()),
});

export const FileMeta = z.object({
  status: z.string(),
  url: z.string(),
});



export type CreateChatbotDto = z.infer<typeof CreateChatbotDto>;
export type SendMessageDto = z.infer<typeof SendMessageDto>;
export type RetrainOptions = z.infer<typeof RetrainOptions>;
export type Chatbot = z.infer<typeof Chatbot>;
export type Message = z.infer<typeof Message>;
export type RetrainJob = z.infer<typeof RetrainJob>;
export type RetrainJobStatus = z.infer<typeof RetrainJobStatus>;
export type FileMeta = z.infer<typeof FileMeta>;


export const UpdateChatbotSettingsDto = z.object({
  chatbotId: z.string(),
  chatbotName: z.optional(z.string()),
  basePrompt: z.optional(z.string()),
  initialMessages: z.optional(z.array(z.string())),
  suggestedMessages: z.optional(z.array(z.string())),
  visibility: z.optional(z.enum(['private', 'public'])),
  onlyAllowOnAddedDomains: z.optional(z.boolean()),
  domains: z.optional(z.array(z.string())),
  rateLimitPoints: z.optional(z.number()),
  rateLimitTimeframe: z.optional(z.number()),
  rateLimitMessage: z.optional(z.string()),
  baseModel: z.optional(z.enum(['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-5-nano', 'gpt-5-mini', 'gpt-5', 'gpt-o1', 'gpt-o3-mini', 'gpt-o3', 'gpt-o4-mini', 'claude-3-5-sonnet', 'claude-3-7-sonnet', 'claude-4-sonnet', 'claude-4-5-sonnet', 'claude-3-5-haiku', 'claude-3-haiku', 'claude-4-opus', 'claude-4.1-opus', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro', 'deepseek-r1'])),
  temperature: z.optional(z.number().check(z.minimum(0), z.maximum(1))),
  storeChat: z.optional(z.boolean()),
  trackIpAddress: z.optional(z.boolean()),
  showCalendar: z.optional(z.boolean()),
  calendarUrl: z.optional(z.string()),
  calendarMessage: z.optional(z.string()),
  enableBouncingAnimation: z.optional(z.boolean()),
  ignoreDataSource: z.optional(z.boolean()),
  customBackend: z.optional(z.string()),
  bearer: z.optional(z.string()),
});

export type UpdateChatbotSettingsDto = z.infer<typeof UpdateChatbotSettingsDto>;
export const chatDataAuth =   PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Chat Data API key',
  required: true,
})