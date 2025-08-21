import { createAction, Property } from '@activepieces/pieces-framework';
import {
  TextClassificationArgs,
  ZeroShotClassificationArgs,
  InferenceClient,
} from '@huggingface/inference';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../../index';

export const textClassification = createAction({
  name: 'text_classification',
  auth: huggingFaceAuth,
  displayName: 'Text Classification',
  description:
    'Classify text into categories using Hugging Face models - includes zero-shot classification for custom categories',
  props: {
    classificationMode: Property.StaticDropdown({
      displayName: 'Classification Type',
      description: 'Choose your classification approach',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: '🎯 Zero-Shot (Custom Categories)',
            value: 'zero-shot',
          },
          {
            label: '📊 Pre-trained Models',
            value: 'pretrained',
          },
          {
            label: '🔍 Search All Models',
            value: 'search',
          },
        ],
      },
      defaultValue: 'zero-shot',
    }),
    zeroShotModel: Property.StaticDropdown({
      displayName: 'Zero-Shot Model',
      description: 'Model for classifying into your custom categories',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: '🔥 Facebook BART-Large (5.4M downloads)',
            value: 'facebook/bart-large-mnli',
          },
          {
            label: '🔥 DeBERTa TaskSource (904K downloads)',
            value: 'sileod/deberta-v3-base-tasksource-nli',
          },
          {
            label: '🔥 DeBERTa MNLI-FEVER (668K downloads)',
            value: 'MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli',
          },
          {
            label: '🌍 DistilBERT Multilingual (520K downloads)',
            value:
              'lxyuan/distilbert-base-multilingual-cased-sentiments-student',
          },
        ],
      },
      defaultValue: 'facebook/bart-large-mnli',
    }),
    customLabels: Property.LongText({
      displayName: 'Custom Categories',
      description:
        'Enter categories separated by commas (e.g., "customer support, sales inquiry, spam, billing question")',
      required: false,
    }),
    pretrainedModel: Property.StaticDropdown({
      displayName: 'Pre-trained Model',
      description: 'Select a specialized pre-trained classification model',
      required: false,
      options: {
        disabled: false,
        options: [
          // === SENTIMENT ANALYSIS ===
          {
            label: '😊 Sentiment: Twitter RoBERTa (3M downloads)',
            value: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
          },
          {
            label: '😊 Sentiment: DistilBERT SST-2 (2.9M downloads)',
            value: 'distilbert/distilbert-base-uncased-finetuned-sst-2-english',
          },
          {
            label: '🌍 Sentiment: Multilingual BERT (1.7M downloads)',
            value: 'nlptown/bert-base-multilingual-uncased-sentiment',
          },

          // === BUSINESS & FINANCE ===
          {
            label: '💰 Finance: FinBERT Sentiment (1.5M downloads)',
            value: 'ProsusAI/finbert',
          },
          {
            label: '💰 Finance: FinBERT Tone (1.4M downloads)',
            value: 'yiyanghkust/finbert-tone',
          },

          // === CONTENT MODERATION ===
          {
            label: '🛡️ Hate Speech: RoBERTa (2M downloads)',
            value: 'facebook/roberta-hate-speech-dynabench-r4-target',
          },
          {
            label: '🛡️ Toxicity: HateBERT (1.1M downloads)',
            value: 'tomh/toxigen_hatebert',
          },
          {
            label: '🛡️ Toxicity: ToxDect RoBERTa (1.1M downloads)',
            value: 'Xuhui/ToxDect-roberta-large',
          },

          // === CUSTOMER SERVICE ===
          {
            label: '🎧 Customer Service: Banking Intent',
            value:
              'atulgupta002/banking_customer_service_query_intent_classifier',
          },
          {
            label: '📧 Spam: SMS Classification',
            value: 'wesleyacheng/sms-spam-classification-with-bert',
          },
        ],
      },
      defaultValue: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
    }),
    searchModel: Property.Dropdown({
      displayName: 'Search Models',
      description: 'Search from all available text classification models',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        const popularModels = [
          {
            label: '🔥 Facebook BART Zero-Shot (5.4M downloads)',
            value: 'facebook/bart-large-mnli',
          },
          {
            label: '🔥 Twitter Sentiment RoBERTa (3M downloads)',
            value: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
          },
          {
            label: '🔥 DistilBERT Sentiment (2.9M downloads)',
            value: 'distilbert/distilbert-base-uncased-finetuned-sst-2-english',
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
              filter: 'text-classification',
              sort: 'downloads',
              direction: '-1',
              limit: '100',
            },
          });

          const models = response.body as Array<{
            id: string;
            downloads: number;
            pipeline_tag: string;
          }>;

          const classificationModels = models
            .filter(
              (model) =>
                model.pipeline_tag === 'text-classification' ||
                model.pipeline_tag === 'zero-shot-classification'
            )
            .map((model) => ({
              label: `${model.id} (${
                model.downloads?.toLocaleString() || 0
              } downloads)`,
              value: model.id,
            }))
            .slice(0, 50);

          const allOptions = [
            ...popularModels,
            ...classificationModels.filter(
              (model) =>
                !popularModels.some((popular) => popular.value === model.value)
            ),
          ];

          return {
            disabled: false,
            options: allOptions,
          };
        } catch (error) {
          return {
            disabled: false,
            options: popularModels,
          };
        }
      },
    }),
    text: Property.LongText({
      displayName: 'Text to Classify',
      description: 'The text content you want to classify',
      required: true,
    }),
    topK: Property.Number({
      displayName: 'Number of Results',
      description: 'Number of top predictions to return',
      required: false,
      defaultValue: 3,
    }),
    functionToApply: Property.StaticDropdown({
      displayName: 'Output Function',
      description: 'How to calculate confidence scores',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Softmax (Recommended)', value: 'softmax' },
          { label: 'Sigmoid', value: 'sigmoid' },
          { label: 'None (Raw Scores)', value: 'none' },
        ],
      },
      defaultValue: 'softmax',
    }),
    useCache: Property.Checkbox({
      displayName: 'Use Cache',
      description: 'Use cached results for faster responses',
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
      classificationMode,
      zeroShotModel,
      customLabels,
      pretrainedModel,
      searchModel,
      text,
      topK,
      functionToApply,
      useCache,
      waitForModel,
    } = context.propsValue;

    // Determine which model to use
    let modelToUse: string;
    let isZeroShot = false;

    switch (classificationMode) {
      case 'zero-shot':
        if (!customLabels?.trim()) {
          throw new Error(
            'Please provide custom categories for zero-shot classification (e.g., "positive, negative, neutral")'
          );
        }
        modelToUse = zeroShotModel || 'facebook/bart-large-mnli';
        isZeroShot = true;
        break;
      case 'pretrained':
        modelToUse =
          pretrainedModel || 'cardiffnlp/twitter-roberta-base-sentiment-latest';
        break;
      case 'search':
        if (!searchModel) {
          throw new Error('Please select a model from the search dropdown');
        }
        modelToUse = searchModel;
        break;
      default:
        modelToUse = zeroShotModel || 'facebook/bart-large-mnli';
        isZeroShot = true;
    }

    const hf = new InferenceClient(context.auth as string);

    if (isZeroShot) {
      // Handle zero-shot classification
      const labels = (customLabels || '')
        .split(',')
        .map((label: string) => label.trim())
        .filter((label: string) => label.length > 0);

      if (labels.length === 0) {
        throw new Error(
          'Please provide at least one category for zero-shot classification'
        );
      }

      const args: ZeroShotClassificationArgs = {
        model: modelToUse,
        inputs: text,
        parameters: {
          candidate_labels: labels,
        },
        options: {
          use_cache: useCache ?? true,
          wait_for_model: waitForModel ?? false,
        },
      };

      const zeroShotResult = await hf.zeroShotClassification(args);

      // The result is already an array of {label, score} objects
      const classifications = Array.isArray(zeroShotResult)
        ? zeroShotResult
        : [zeroShotResult];

      // Sort by score and limit to topK
      const sortedResults = classifications
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
        .slice(0, topK || 3);

      return {
        predictions: sortedResults,
        topPrediction: sortedResults[0],
        text: text,
        model: modelToUse,
        classificationMode: 'zero-shot',
        customCategories: labels,
        confidenceThreshold: 0.5,
        highConfidencePredictions: sortedResults.filter(
          (r: { score: number }) => r.score > 0.5
        ),
        rawResult: zeroShotResult,
      };
    } else {
      // Handle regular text classification
      const args: TextClassificationArgs = {
        model: modelToUse,
        inputs: text,
        options: {
          use_cache: useCache ?? true,
          wait_for_model: waitForModel ?? false,
        },
      };

      const parameters: {
        top_k?: number;
        function_to_apply?: 'softmax' | 'sigmoid' | 'none';
      } = {};

      if (topK !== undefined && topK > 0) {
        parameters.top_k = topK;
      }

      if (
        functionToApply &&
        (functionToApply === 'softmax' ||
          functionToApply === 'sigmoid' ||
          functionToApply === 'none')
      ) {
        parameters.function_to_apply = functionToApply;
      }

      if (Object.keys(parameters).length > 0) {
        args.parameters = parameters;
      }

      const classificationResult = await hf.textClassification(args);

      // Ensure result is an array
      const results = Array.isArray(classificationResult)
        ? classificationResult
        : [classificationResult];

      return {
        predictions: results,
        topPrediction: results[0],
        text: text,
        model: modelToUse,
        classificationMode: 'pretrained',
        confidenceThreshold: 0.5,
        highConfidencePredictions: results.filter(
          (r: { score: number }) => r.score > 0.5
        ),
        rawResult: classificationResult,
      };
    }
  },
});
