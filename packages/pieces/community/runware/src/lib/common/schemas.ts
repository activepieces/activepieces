import z from 'zod';

// Base Schemas
const dimensions = z.number().min(128).max(2048);

const model = z.string();

const steps = z.number().min(1).max(100);

const CFGScale = z.number().min(1).max(30);

const scheduler = z.string();

const prompt = z.string().min(2).max(3000);

// Action Schemas
export const generateImagesFromText = {
  positivePrompt: prompt,
  negativePrompt: prompt.optional(),
  model,
  height: dimensions,
  width: dimensions,
  steps: steps.optional(),
  CFGScale: CFGScale.optional(),
  scheduler: scheduler.optional(),
  seed: z.number().min(0).max(9223372036854776000).optional(),
  vae: z.string().optional(),
  clipSkip: z.number().min(1).max(2).optional(),
};

export const generateImagesFromExistingImage = {
  seedImage: z.string().url(),
  positivePrompt: prompt,
  negativePrompt: prompt.optional(),
  model,
  strength: z.number().min(0).max(1).optional(),
  height: dimensions,
  width: dimensions,
  steps: steps.optional(),
  CFGScale: CFGScale.optional(),
  scheduler: scheduler.optional(),
};

export const generateVideoFromText = {
  positivePrompt: prompt,
  negativePrompt: prompt.optional(),
  model,
  duration: z.number().min(1).max(10).optional(),
  fps: z.number().min(15).max(60).optional(),
  outputFormat: z.enum(['MP4', 'WEBM', 'MOV']).optional(),
  outputQuality: z.number().min(20).max(99).optional(),
  uploadEndpoint: z.string().url().optional(),
  numberResults: z.number().min(1).max(4).optional(),
};

export const imageBackgroundRemoval = {
  inputImage: z.string().url(),
  model,
  outputFormat: z.enum(['PNG', 'JPG', 'WEBP']).optional(),
  outputQuality: z.number().min(20).max(99).optional(),
  uploadEndpoint: z.string().url().optional(),
};
