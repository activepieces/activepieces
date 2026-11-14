import { describe, expect, it } from 'bun:test';
import { defaultLLM, isAllowedLLM, type GeminiModel } from './common';

describe('Google Gemini common', () => {
  describe('defaultLLM', () => {
    it('should default to gemini-2.5-flash', () => {
      expect(defaultLLM).toBe('gemini-2.5-flash');
    });
  });

  describe('isAllowedLLM', () => {
    it('should allow Gemini 2.5 and 3+ text models with generateContent', () => {
      const allowedModels: GeminiModel[] = [
        {
          name: 'models/gemini-2.5-flash',
          displayName: 'Gemini 2.5 Flash',
          supportedGenerationMethods: ['generateContent', 'countTokens'],
        },
        {
          name: 'models/gemini-2.5-pro',
          displayName: 'Gemini 2.5 Pro',
          supportedGenerationMethods: ['generateContent', 'countTokens'],
        },
        {
          name: 'models/gemini-3-flash-preview',
          displayName: 'Gemini 3 Flash Preview',
          supportedGenerationMethods: ['generateContent', 'countTokens'],
        },
        {
          name: 'models/gemini-3.1-pro-preview',
          displayName: 'Gemini 3.1 Pro Preview',
          supportedGenerationMethods: ['generateContent', 'countTokens'],
        },
        {
          name: 'models/gemini-3.5-flash',
          displayName: 'Gemini 3.5 Flash',
          supportedGenerationMethods: ['generateContent'],
        },
        {
          name: 'models/gemini-4-argon',
          displayName: 'Gemini 4 Argon',
          supportedGenerationMethods: ['generateContent'],
        },
      ];

      for (const model of allowedModels) {
        expect(isAllowedLLM(model)).toBe(true);
      }
    });

    it('should reject models that do not support generateContent', () => {
      const model: GeminiModel = {
        name: 'models/text-embedding-004',
        displayName: 'Text Embedding 004',
        supportedGenerationMethods: ['embedContent'],
      };

      expect(isAllowedLLM(model)).toBe(false);
    });

    it('should reject image, tts, veo, and embedding models even if generateContent is present', () => {
      const specializedModels: GeminiModel[] = [
        {
          name: 'models/gemini-2.5-flash-image',
          displayName: 'Gemini 2.5 Flash Image',
          supportedGenerationMethods: ['generateContent'],
        },
        {
          name: 'models/gemini-3-pro-image-preview',
          displayName: 'Gemini 3 Pro Image Preview',
          supportedGenerationMethods: ['generateContent'],
        },
        {
          name: 'models/gemini-2.5-flash-tts',
          displayName: 'Gemini 2.5 Flash TTS',
          supportedGenerationMethods: ['generateContent'],
        },
        {
          name: 'models/veo-2.0-generate-001',
          displayName: 'Veo 2.0',
          supportedGenerationMethods: ['generateContent'],
        },
        {
          name: 'models/text-embedding-gecko',
          displayName: 'Text Embedding Gecko',
          supportedGenerationMethods: ['generateContent'],
        },
      ];

      for (const model of specializedModels) {
        expect(isAllowedLLM(model)).toBe(false);
      }
    });

    it('should reject live, transcribe, robotics, omni, and gemma models', () => {
      const excludedModels: GeminiModel[] = [
        {
          name: 'models/gemini-2.0-flash-live',
          displayName: 'Gemini 2.0 Flash Live',
          supportedGenerationMethods: ['generateContent'],
        },
        {
          name: 'models/gemini-1.5-flash-transcribe',
          displayName: 'Gemini 1.5 Flash Transcribe',
          supportedGenerationMethods: ['generateContent'],
        },
        {
          name: 'models/gemini-robotics-er-1',
          displayName: 'Gemini Robotics ER 1',
          supportedGenerationMethods: ['generateContent'],
        },
        {
          name: 'models/gemini-omni-flash',
          displayName: 'Gemini Omni Flash',
          supportedGenerationMethods: ['generateContent'],
        },
        {
          name: 'models/gemma-2-9b-it',
          displayName: 'Gemma 2 9B IT',
          supportedGenerationMethods: ['generateContent'],
        },
      ];

      for (const model of excludedModels) {
        expect(isAllowedLLM(model)).toBe(false);
      }
    });

    it('should fall back to allowedLLMs prefix list if supportedGenerationMethods is omitted', () => {
      const legacyModel: GeminiModel = {
        name: 'models/gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
      };

      expect(isAllowedLLM(legacyModel)).toBe(true);

      const unknownLegacyModel: GeminiModel = {
        name: 'models/custom-unknown-model',
        displayName: 'Custom Unknown Model',
      };

      expect(isAllowedLLM(unknownLegacyModel)).toBe(false);
    });
  });
});
