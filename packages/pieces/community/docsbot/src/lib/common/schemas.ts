import z from 'zod';

export const askQuestion = {
  teamId: z.string(),
  botId: z.string(),
  question: z.string(),
  metadata: z.object({}).optional(),
  context_items: z.number().min(1).optional(),
  human_escalation: z.boolean().optional(),
  followup_rating: z.boolean().optional(),
  document_retriever: z.boolean().optional(),
  full_source: z.boolean().optional(),
  autocut: z.number().optional(),
  testing: z.boolean().optional(),
  image_urls: z.array(z.string().url()).optional(),
  model: z.string().optional(),
  default_language: z.string().optional(),
  reasoning_effort: z.enum(['minimal', 'low', 'medium', 'high']).optional(),
};

export const createSource = z
  .object({
    type: z.enum([
      'url',
      'document',
      'sitemap',
      'wp',
      'urls',
      'csv',
      'rss',
      'qa',
      'youtube',
    ]),
    title: z.string().optional(),
    url: z.string().url().optional(),
    file: z.string().optional(),
    faqs: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        })
      )
      .optional(),
    scheduleInterval: z.enum(['daily', 'weekly', 'monthly', 'none']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'document' && (!data.title || data.title.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['title'],
        message: '"title" is required when type is "document".',
      });
    }
    if (
      ['url', 'sitemap', 'youtube', 'rss'].includes(data.type) &&
      (!data.url || data.url.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message:
          '"url" is required when type is "url", "sitemap", "youtube", or "rss".',
      });
    }
    if (
      ['urls', 'csv', 'document', 'wp'].includes(data.type) &&
      (!data.file || data.file.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['file'],
        message:
          '"file" is required when type is "urls", "csv", "document", or "wp".',
      });
    }
    if (data.type === 'qa' && (!data.faqs || data.faqs.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['faqs'],
        message: '"faqs" is required when type is "qa".',
      });
    }
  });

export const uploadSourceFile = {
  teamId: z.string(),
  botId: z.string(),
  file: z.object({
    filename: z.string(),
    data: z.instanceof(Buffer),
    extension: z.string().optional(),
  }),
};

export const createBot = {
  teamId: z.string(),
  name: z.string(),
  description: z.string(),
  privacy: z.enum(['public', 'private']),
  language: z.enum(['en', 'jp']),
  model: z.string().optional(),
  embeddingModel: z
    .enum([
      'text-embedding-ada-002',
      'text-embedding-3-large',
      'text-embedding-3-small',
      'embed-multilingual-v3.0',
      'embed-v4.0',
    ])
    .optional(),
  copyFrom: z.string().optional(),
};

export const findBot = {
  teamId: z.string(),
  name: z.string(),
};
