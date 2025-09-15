import z from 'zod';

export const AddVideoSchema = {
  video_url: z.string().url('Invalid URL.'),
};

export const CreateFaqSchema = {
  title: z.string(),
  description: z.string().optional(),
};

export const StartTrainingSchema = {
    id: z.string().uuid('Invalid UUID.'),
};

export const AddFaqItemSchema = {
    faq_id: z.string().uuid('Invalid UUID.'),
    question: z.string(),
    answer: z.string(),
    source_url: z.string().url('Invalid URL.').optional(),
    categories: z.array(z.string()).optional(),
};

export const AddWebsiteSchema = {
    website_url: z.string().url('Invalid URL.'),
};

export const CreateChatbotReplySchema = {
    chatbot_id: z.string().uuid('Invalid UUID.'),
    message: z.string(),
    session_id: z.string().uuid('Invalid UUID.').optional(),
};
