import { z } from 'zod';

export const GenerateVideoRequestSchema = z.object({
  topic: z.string().optional(),
  prompt: z.string().optional(),
  voice: z.string().optional(),
  theme: z.string().optional(),
  style: z.string().optional(),
  language: z.string().optional(),
  duration: z.enum(['30-60', '60-90', '90-120', '5 min', '10 min']).optional(),
  aspect_ratio: z.enum(['9:16', '1:1', '16:9']).optional(),
  custom_instruction: z.string().optional(),
  use_ai: z.enum(['1', '0']).optional(),
  include_voiceover: z.enum(['1', '0']).optional(),
  size: z.string().optional(),
  ypos: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  bg_music: z.string().optional(),
  bg_music_volume: z.number().min(1).max(100).optional()
});

export const GeneratePodcastRequestSchema = z.object({
  content_source: z.enum(['url', 'text']),
  url: z.string().url().optional().or(z.literal('')),
  text: z.string().optional(),
  name1: z.string().min(1),
  voice1: z.string().optional(),
  name2: z.string().min(1),
  voice2: z.string().optional(),
  theme: z.string().optional(),
  language: z.string().optional(),
  duration: z.enum(['1-2', '3-5']).optional(),
  tone: z.string().optional()
});

export const VadooApiResponseSchema = z.object({
  vid: z.number()
});

// Export the object schemas for use with propsValidation.validateZod
export const generateVideoSchema = {
  topic: z.string().optional(),
  prompt: z.string().optional(),
  voice: z.string().optional(),
  theme: z.string().optional(),
  style: z.string().optional(),
  language: z.string().optional(),
  duration: z.enum(['30-60', '60-90', '90-120', '5 min', '10 min']).optional(),
  aspect_ratio: z.enum(['9:16', '1:1', '16:9']).optional(),
  custom_instruction: z.string().optional(),
  use_ai: z.enum(['1', '0']).optional(),
  include_voiceover: z.enum(['1', '0']).optional(),
  size: z.string().optional(),
  ypos: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  bg_music: z.string().optional(),
  bg_music_volume: z.number().min(1).max(100).optional()
};

export const generatePodcastSchema = {
  content_source: z.enum(['url', 'text']),
  url: z.string().url().optional().or(z.literal('')),
  text: z.string().optional(),
  name1: z.string().min(1),
  voice1: z.string().optional(),
  name2: z.string().min(1),
  voice2: z.string().optional(),
  theme: z.string().optional(),
  language: z.string().optional(),
  duration: z.enum(['1-2', '3-5']).optional(),
  tone: z.string().optional()
};

export const generateAiImageSchema = {
  id: z.number().int().positive(),
  ratio: z.enum(['9:16', '1:1', '16:9', '3:4', '4:3']),
  prompt: z.string().min(1)
};

export const generateAiCaptionsSchema = {
  url: z.string().url(),
  theme: z.string().optional(),
  language: z.string().optional()
};