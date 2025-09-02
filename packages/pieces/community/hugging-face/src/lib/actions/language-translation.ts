import { createAction, Property } from '@activepieces/pieces-framework';
import { TranslationArgs, InferenceClient } from '@huggingface/inference';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../../index';

export const languageTranslation = createAction({
  name: 'language_translation',
  auth: huggingFaceAuth,
  displayName: 'Language Translation',
  description:
    'Translate text between languages using specialized Hugging Face translation models',
  props: {
    model: Property.Dropdown({
      displayName: 'Translation Model',
      description:
        'Select a translation model or search from 7000+ available models',
      required: true,
      refreshers: [],
      defaultValue: 'Helsinki-NLP/opus-mt-fr-en',
      options: async ({ auth }) => {
        // Return popular models immediately, then fetch more if auth is available
        const popularModels = [
          // === TO ENGLISH (Most Popular) ===
          {
            label: '🔥 French → English (953K downloads)',
            value: 'Helsinki-NLP/opus-mt-fr-en',
          },
          {
            label: '🔥 Russian → English (426K downloads)',
            value: 'Helsinki-NLP/opus-mt-ru-en',
          },
          {
            label: '🔥 Dutch → English (389K downloads)',
            value: 'Helsinki-NLP/opus-mt-nl-en',
          },
          {
            label: '🔥 Chinese → English (362K downloads)',
            value: 'Helsinki-NLP/opus-mt-zh-en',
          },
          {
            label: '🔥 German → English (338K downloads)',
            value: 'Helsinki-NLP/opus-mt-de-en',
          },
          {
            label: '🔥 Spanish → English (181K downloads)',
            value: 'Helsinki-NLP/opus-mt-es-en',
          },

          // === FROM ENGLISH ===
          {
            label: '🔥 English → German (276K downloads)',
            value: 'Helsinki-NLP/opus-mt-en-de',
          },
          {
            label: '🔥 English → French (223K downloads)',
            value: 'Helsinki-NLP/opus-mt-en-fr',
          },
          {
            label: '🔥 English → Spanish (204K downloads)',
            value: 'Helsinki-NLP/opus-mt-en-es',
          },

          // === OTHER POPULAR ===
          {
            label: '🔥 Arabic → English (246K downloads)',
            value: 'Helsinki-NLP/opus-mt-ar-en',
          },
          {
            label: '🔥 Korean → English (236K downloads)',
            value: 'Helsinki-NLP/opus-mt-ko-en',
          },
          {
            label: '🔥 Italian → English (231K downloads)',
            value: 'Helsinki-NLP/opus-mt-it-en',
          },
        ];

        if (!auth) {
          return {
            disabled: false,
            options: popularModels,
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://huggingface.co/api/models',
            queryParams: {
              filter: 'translation',
              sort: 'downloads',
              direction: '-1',
              limit: '200',
            },
          });

          const models = response.body as Array<{
            id: string;
            downloads: number;
            pipeline_tag: string;
          }>;

          const translationModels = models
            .filter((model) => model.pipeline_tag === 'translation')
            .map((model) => ({
              label: `${model.id} (${
                model.downloads?.toLocaleString() || 0
              } downloads)`,
              value: model.id,
            }))
            .slice(0, 100); // Limit for better performance

          // Combine popular models (marked) with all available models
          const allOptions = [
            ...popularModels,
            { label: '─── All Available Models ───', value: '__separator__' },
            ...translationModels.filter(
              (model) =>
                !popularModels.some((popular) => popular.value === model.value)
            ),
          ];

          return {
            disabled: false,
            options: allOptions.filter(
              (option) => option.value !== '__separator__'
            ),
          };
        } catch (error) {
          // If API fails, fallback to popular models
          return {
            disabled: false,
            options: popularModels,
          };
        }
      },
    }),
    customModel: Property.ShortText({
      displayName: 'Or Enter Custom Model ID',
      description:
        'Alternative: Enter any Hugging Face translation model ID directly (e.g., Helsinki-NLP/opus-mt-ja-en)',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Text to Translate',
      description: 'The text content you want to translate',
      required: true,
    }),
    sourceLanguage: Property.ShortText({
      displayName: 'Source Language (Optional)',
      description:
        'Source language code (e.g., "en", "es", "fr"). Only needed for multilingual models that support multiple language pairs.',
      required: false,
    }),
    targetLanguage: Property.ShortText({
      displayName: 'Target Language (Optional)',
      description:
        'Target language code (e.g., "fr", "de", "zh"). Only needed for multilingual models that support multiple language pairs.',
      required: false,
    }),
    cleanUpSpaces: Property.Checkbox({
      displayName: 'Clean Up Extra Spaces',
      description: 'Remove potential extra spaces in the translation output',
      required: false,
      defaultValue: true,
    }),
    maxLength: Property.Number({
      displayName: 'Max Translation Length',
      description:
        'Maximum length of the translated text (leave empty for default)',
      required: false,
    }),
    useCache: Property.Checkbox({
      displayName: 'Use Cache',
      description: 'Use cached results if available for faster responses',
      required: false,
      defaultValue: true,
    }),
    waitForModel: Property.Checkbox({
      displayName: 'Wait for Model',
      description: 'Wait for model to load if not immediately available',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      model,
      customModel,
      text,
      sourceLanguage,
      targetLanguage,
      cleanUpSpaces,
      maxLength,
      useCache,
      waitForModel,
    } = context.propsValue;

    // Determine which model to use
    const modelToUse = customModel?.trim() || model;

    if (!modelToUse) {
      throw new Error(
        'Please select a model from the dropdown or enter a custom model ID'
      );
    }

    const hf = new InferenceClient(context.auth as string);

    const args: TranslationArgs = {
      model: modelToUse,
      inputs: text,
      options: {
        use_cache: useCache ?? true,
        wait_for_model: waitForModel ?? false,
      },
    };

    // Build parameters object
    const parameters: {
      clean_up_tokenization_spaces?: boolean;
      src_lang?: string;
      tgt_lang?: string;
      generate_parameters?: {
        max_length?: number;
      };
    } = {};

    if (cleanUpSpaces !== undefined) {
      parameters.clean_up_tokenization_spaces = cleanUpSpaces;
    }

    if (sourceLanguage?.trim()) {
      parameters.src_lang = sourceLanguage.trim();
    }

    if (targetLanguage?.trim()) {
      parameters.tgt_lang = targetLanguage.trim();
    }

    if (maxLength !== undefined && maxLength > 0) {
      parameters.generate_parameters = {
        max_length: maxLength,
      };
    }

    if (Object.keys(parameters).length > 0) {
      args.parameters = parameters;
    }

    const translationResult = await hf.translation(args);

    return {
      translatedText: translationResult.translation_text,
      originalText: text,
      model: modelToUse,
      sourceLanguage: sourceLanguage || 'auto-detected',
      targetLanguage: targetLanguage || 'model-default',
      parameters: parameters,
      rawResult: translationResult,
    };
  },
});
