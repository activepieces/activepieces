import z from 'zod';

// Common Schemas
const promptText = z.string().min(1).max(1000);

const seed = z.number().int().min(0).max(4294967295);

const publicFigureThreshold = z.enum(['low', 'auto']);

// Action Schemas
export const generateImageFromText = {
  model: z.enum(['gen4_image', 'gen4_image_turbo']),
  promptText,
  ratio: z.enum([
    '1920:1080',
    '1080:1920',
    '1024:1024',
    '1360:768',
    '1080:1080',
    '1168:880',
    '1440:1080',
    '1080:1440',
    '1808:768',
    '2112:912',
    '1280:720',
    '720:1280',
    '720:720',
    '960:720',
    '720:960',
    '1680:720',
  ]),
  referenceImages: z
    .array(
      z.object({
        uri: z.string().url(),
        tag: z.string().optional(),
      })
    )
    .min(1)
    .max(3),
  publicFigureThreshold: publicFigureThreshold.optional(),
  seed: seed.optional(),
};

export const generateVideoFromImageGen3aTurbo = {
  model: z.literal('gen3a_turbo'),
  promptImage: z.object({
    images: z.string().url(),
  }),
  ratio: z.object({ ratio: z.enum(['1280:768', '768:1280']) }),
  publicFigureThreshold: publicFigureThreshold.optional(),
  duration: z.literal(5).or(z.literal(10)).optional(),
  promptText: promptText.optional(),
  seed: seed.optional(),
};

export const generateVideoFromImageGen4Turbo = {
  model: z.literal('gen4_turbo'),
  promptImage: z.object({
    images: z
      .array(
        z.object({
          url: z.string().url(),
          position: z.enum(['first', 'last']).optional(),
        })
      )
      .max(2),
  }),
  ratio: z.object({
    ratio: z.enum([
      '1280:720',
      '720:1280',
      '1104:832',
      '832:1104',
      '960:960',
      '1584:672',
    ]),
  }),
  publicFigureThreshold: publicFigureThreshold.optional(),
  duration: z.literal(5).or(z.literal(10)).optional(),
  promptText: promptText.optional(),
  seed: seed.optional(),
};

export const getTaskDetails = {
  taskId: z.string().min(1),
};

export const cancelOrDeleteATask = {
  taskId: z.string().min(1),
};
