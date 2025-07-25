export const XAI_BASE_URL = 'https://api.x.ai/v1';

export const XAI_MODELS = {
  GROK_BETA: 'grok-beta',
  GROK_VISION_BETA: 'grok-vision-beta'
} as const;

export const DEFAULT_MODEL = XAI_MODELS.GROK_BETA;

export const MODEL_LIMITS = {
  [XAI_MODELS.GROK_BETA]: {
    maxTokens: 131072,
    contextWindow: 131072
  },
  [XAI_MODELS.GROK_VISION_BETA]: {
    maxTokens: 131072,
    contextWindow: 131072
  }
} as const;

export const SUPPORTED_IMAGE_FORMATS = [
  'png', 'jpeg', 'jpg', 'gif', 'webp'
] as const; 