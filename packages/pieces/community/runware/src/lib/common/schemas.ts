import * as z from 'zod/mini'

// Base Schemas
const dimensions = z.number().check(z.minimum(128), z.maximum(2048));

const model = z.string();

const steps = z.number().check(z.minimum(1), z.maximum(100));

const CFGScale = z.number().check(z.minimum(1), z.maximum(30));

const scheduler = z.string();

const prompt = z.string().check(z.minLength(2), z.maxLength(3000));

// Action Schemas
export const generateImagesFromText = {
  positivePrompt: prompt,
  negativePrompt: z.optional(prompt),
  model,
  height: dimensions,
  width: dimensions,
  steps: z.optional(steps),
  CFGScale: z.optional(CFGScale),
  scheduler: z.optional(scheduler),
  seed: z.optional(z.number().check(z.minimum(0), z.maximum(9223372036854776000))),
  vae: z.optional(z.string()),
  clipSkip: z.optional(z.number().check(z.minimum(1), z.maximum(2))),
};

export const generateImagesFromExistingImage = {
  seedImage: z.string().check(z.url()),
  positivePrompt: prompt,
  negativePrompt: z.optional(prompt),
  model,
  strength: z.optional(z.number().check(z.minimum(0), z.maximum(1))),
  height: dimensions,
  width: dimensions,
  steps: z.optional(steps),
  CFGScale: z.optional(CFGScale),
  scheduler: z.optional(scheduler),
};

export const generateVideoFromText = {
  positivePrompt: prompt,
  negativePrompt: z.optional(prompt),
  model,
  duration: z.optional(z.number().check(z.minimum(1), z.maximum(10))),
  fps: z.optional(z.number().check(z.minimum(15), z.maximum(60))),
  outputFormat: z.optional(z.enum(['MP4', 'WEBM', 'MOV'])),
  outputQuality: z.optional(z.number().check(z.minimum(20), z.maximum(99))),
  uploadEndpoint: z.optional(z.string().check(z.url())),
  numberResults: z.optional(z.number().check(z.minimum(1), z.maximum(4))),
};

export const imageBackgroundRemoval = {
  inputImage: z.string().check(z.url()),
  model,
  outputFormat: z.optional(z.enum(['PNG', 'JPG', 'WEBP'])),
  outputQuality: z.optional(z.number().check(z.minimum(20), z.maximum(99))),
  uploadEndpoint: z.optional(z.string().check(z.url())),
};
