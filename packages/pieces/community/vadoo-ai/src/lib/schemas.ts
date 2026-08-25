import * as z from 'zod/mini'

export const GenerateVideoRequestSchema = z.object({
  topic: z.optional(z.string()),
  prompt: z.optional(z.string()),
  voice: z.optional(z.string()),
  theme: z.optional(z.string()),
  style: z.optional(z.string()),
  language: z.optional(z.string()),
  duration: z.optional(z.enum(['30-60', '60-90', '90-120', '5 min', '10 min'])),
  aspect_ratio: z.optional(z.enum(['9:16', '1:1', '16:9'])),
  custom_instruction: z.optional(z.string()),
  use_ai: z.optional(z.enum(['1', '0'])),
  include_voiceover: z.optional(z.enum(['1', '0'])),
  size: z.optional(z.string()),
  ypos: z.optional(z.string()),
  url: z.union([z.optional(z.string().check(z.url())), z.literal('')]),
  bg_music: z.optional(z.string()),
  bg_music_volume: z.optional(z.number().check(z.minimum(1), z.maximum(100)))
});

export const GeneratePodcastRequestSchema = z.object({
  content_source: z.enum(['url', 'text']),
  url: z.union([z.optional(z.string().check(z.url())), z.literal('')]),
  text: z.optional(z.string()),
  name1: z.string().check(z.minLength(1)),
  voice1: z.optional(z.string()),
  name2: z.string().check(z.minLength(1)),
  voice2: z.optional(z.string()),
  theme: z.optional(z.string()),
  language: z.optional(z.string()),
  duration: z.optional(z.enum(['1-2', '3-5'])),
  tone: z.optional(z.string())
});

export const VadooApiResponseSchema = z.object({
  vid: z.number()
});

// Export the object schemas for use with propsValidation.validateZod
export const generateVideoSchema = {
  topic: z.optional(z.string()),
  prompt: z.optional(z.string()),
  voice: z.optional(z.string()),
  theme: z.optional(z.string()),
  style: z.optional(z.string()),
  language: z.optional(z.string()),
  duration: z.optional(z.enum(['30-60', '60-90', '90-120', '5 min', '10 min'])),
  aspect_ratio: z.optional(z.enum(['9:16', '1:1', '16:9'])),
  custom_instruction: z.optional(z.string()),
  use_ai: z.optional(z.enum(['1', '0'])),
  include_voiceover: z.optional(z.enum(['1', '0'])),
  size: z.optional(z.string()),
  ypos: z.optional(z.string()),
  url: z.union([z.optional(z.string().check(z.url())), z.literal('')]),
  bg_music: z.optional(z.string()),
  bg_music_volume: z.optional(z.number().check(z.minimum(1), z.maximum(100)))
};

export const generatePodcastSchema = {
  content_source: z.enum(['url', 'text']),
  url: z.union([z.optional(z.string().check(z.url())), z.literal('')]),
  text: z.optional(z.string()),
  name1: z.string().check(z.minLength(1)),
  voice1: z.optional(z.string()),
  name2: z.string().check(z.minLength(1)),
  voice2: z.optional(z.string()),
  theme: z.optional(z.string()),
  language: z.optional(z.string()),
  duration: z.optional(z.enum(['1-2', '3-5'])),
  tone: z.optional(z.string())
};

export const generateAiImageSchema = {
  id: z.string().check(z.minLength(1)),
  ratio: z.enum(['9:16', '1:1', '16:9', '3:4', '4:3']),
  style: z.optional(z.string()),
  prompt: z.string().check(z.minLength(1))
};

export const generateAiCaptionsSchema = {
  url: z.string().check(z.url()),
  theme: z.optional(z.string()),
  language: z.optional(z.string())
};