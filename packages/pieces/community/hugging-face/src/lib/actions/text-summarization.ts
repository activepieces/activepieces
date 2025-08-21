import { createAction, Property } from '@activepieces/pieces-framework';
import { SummarizationArgs, InferenceClient } from '@huggingface/inference';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../../index';

export const textSummarization = createAction({
  name: 'text_summarization',
  auth: huggingFaceAuth,
  displayName: 'Text Summarization',
  description:
    'Generate abstractive summaries of long text using Hugging Face models - optimized for business content',
  props: {
    contentType: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'What type of content are you summarizing?',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: '📰 News Articles & Blog Posts',
            value: 'news',
          },
          {
            label: '📧 Emails & Support Tickets',
            value: 'email',
          },
          {
            label: '🎯 Meetings & Conversations',
            value: 'meeting',
          },
          {
            label: '📚 General Text & Documents',
            value: 'general',
          },
          {
            label: '🏥 Medical & Scientific',
            value: 'medical',
          },
          {
            label: '🌍 Multilingual Content',
            value: 'multilingual',
          },
          {
            label: '🔍 Search All Models',
            value: 'search',
          },
        ],
      },
      defaultValue: 'news',
    }),
    model: Property.Dropdown({
      displayName: 'Summarization Model',
      description: 'Select the best model for your content type',
      required: true,
      refreshers: ['contentType'],
      options: async ({ auth, contentType }) => {
        // Define model options based on content type
        const getModelsByType = (type: string) => {
          switch (type) {
            case 'news':
              return [
                {
                  label:
                    '🔥 Facebook BART-CNN (4.5M downloads) - News optimized',
                  value: 'facebook/bart-large-cnn',
                },
                {
                  label: '⚡ DistilBART-CNN (2M downloads) - Faster',
                  value: 'sshleifer/distilbart-cnn-12-6',
                },
                {
                  label:
                    '📝 Google Pegasus-XSum (118K downloads) - Abstractive',
                  value: 'google/pegasus-xsum',
                },
              ];
            case 'email':
              return [
                {
                  label: '🔥 Facebook BART-CNN (4.5M downloads) - Best overall',
                  value: 'facebook/bart-large-cnn',
                },
                {
                  label:
                    '📧 Falconsai Text Summary (30K downloads) - General text',
                  value: 'Falconsai/text_summarization',
                },
                {
                  label:
                    '⚡ Google T5-Small (2.7M downloads) - Fast & versatile',
                  value: 'google-t5/t5-small',
                },
              ];
            case 'meeting':
              return [
                {
                  label:
                    '🎯 Meeting Summary (29K downloads) - Meeting optimized',
                  value: 'knkarthick/MEETING_SUMMARY',
                },
                {
                  label:
                    '💬 BART SAMSum (104K downloads) - Conversation focused',
                  value: 'philschmid/bart-large-cnn-samsum',
                },
                {
                  label: '🔥 Facebook BART-CNN (4.5M downloads) - Reliable',
                  value: 'facebook/bart-large-cnn',
                },
              ];
            case 'general':
              return [
                {
                  label: '🔥 Google T5-Base (1.7M downloads) - High quality',
                  value: 'google-t5/t5-base',
                },
                {
                  label: '⚡ Google T5-Small (2.7M downloads) - Fast',
                  value: 'google-t5/t5-small',
                },
                {
                  label: '🎯 Google T5-Large (327K downloads) - Best quality',
                  value: 'google-t5/t5-large',
                },
              ];
            case 'medical':
              return [
                {
                  label:
                    '🏥 Medical Summarization (45K downloads) - Medical optimized',
                  value: 'Falconsai/medical_summarization',
                },
                {
                  label: '📚 Google T5-Base (1.7M downloads) - General purpose',
                  value: 'google-t5/t5-base',
                },
                {
                  label: '🔥 Facebook BART-CNN (4.5M downloads) - Reliable',
                  value: 'facebook/bart-large-cnn',
                },
              ];
            case 'multilingual':
              return [
                {
                  label: '🌍 mT5 Multilingual (37K downloads) - 44 languages',
                  value: 'csebuetnlp/mT5_multilingual_XLSum',
                },
                {
                  label:
                    '⚡ Google T5-Small (2.7M downloads) - Multilingual capable',
                  value: 'google-t5/t5-small',
                },
                {
                  label: '🎯 Google T5-Base (1.7M downloads) - Better quality',
                  value: 'google-t5/t5-base',
                },
              ];
            default:
              return [
                {
                  label: '🔥 Facebook BART-CNN (4.5M downloads)',
                  value: 'facebook/bart-large-cnn',
                },
              ];
          }
        };

        // Return content-specific models for non-search types
        if (contentType !== 'search') {
          return {
            disabled: false,
            options: getModelsByType((contentType as string) || 'news'),
          };
        }

        // Handle search mode - load all summarization models
        const popularModels = [
          {
            label: '🔥 Facebook BART-CNN (4.5M downloads)',
            value: 'facebook/bart-large-cnn',
          },
          {
            label: '⚡ DistilBART-CNN (2M downloads)',
            value: 'sshleifer/distilbart-cnn-12-6',
          },
          {
            label: '🎯 Google T5-Base (1.7M downloads)',
            value: 'google-t5/t5-base',
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
              filter: 'summarization',
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

          const summarizationModels = models
            .filter((model) => model.pipeline_tag === 'summarization')
            .map((model) => ({
              label: `${model.id} (${
                model.downloads?.toLocaleString() || 0
              } downloads)`,
              value: model.id,
            }))
            .slice(0, 50);

          const allOptions = [
            ...popularModels,
            ...summarizationModels.filter(
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
      defaultValue: 'facebook/bart-large-cnn',
    }),
    text: Property.LongText({
      displayName: 'Text to Summarize',
      description:
        'The long text content you want to summarize (most models work best with 512-1024 tokens)',
      required: true,
    }),
    summaryLength: Property.StaticDropdown({
      displayName: 'Summary Length',
      description: 'How long should the summary be?',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: '📝 Brief (30-80 words)', value: 'brief' },
          { label: '📄 Medium (80-150 words)', value: 'medium' },
          { label: '📚 Detailed (150-300 words)', value: 'detailed' },
          { label: '⚙️ Custom Length', value: 'custom' },
        ],
      },
      defaultValue: 'medium',
    }),
    customMinLength: Property.Number({
      displayName: 'Custom Min Length',
      description: 'Minimum number of tokens for the summary',
      required: false,
    }),
    customMaxLength: Property.Number({
      displayName: 'Custom Max Length',
      description: 'Maximum number of tokens for the summary',
      required: false,
    }),
    cleanUpSpaces: Property.Checkbox({
      displayName: 'Clean Up Extra Spaces',
      description: 'Remove extra spaces and clean up formatting',
      required: false,
      defaultValue: true,
    }),
    truncationStrategy: Property.StaticDropdown({
      displayName: 'Truncation Strategy',
      description: 'How to handle text that exceeds model limits',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Do Not Truncate', value: 'do_not_truncate' },
          { label: 'Longest First', value: 'longest_first' },
          { label: 'Only First', value: 'only_first' },
          { label: 'Only Second', value: 'only_second' },
        ],
      },
      defaultValue: 'longest_first',
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
      contentType,
      model,
      text,
      summaryLength,
      customMinLength,
      customMaxLength,
      cleanUpSpaces,
      truncationStrategy,
      useCache,
      waitForModel,
    } = context.propsValue;

    // Calculate appropriate summary lengths based on selection
    let minLength: number;
    let maxLength: number;

    switch (summaryLength) {
      case 'brief':
        minLength = 30;
        maxLength = 80;
        break;
      case 'medium':
        minLength = 80;
        maxLength = 150;
        break;
      case 'detailed':
        minLength = 150;
        maxLength = 300;
        break;
      case 'custom':
        minLength = customMinLength || 50;
        maxLength = customMaxLength || 150;
        break;
      default:
        minLength = 80;
        maxLength = 150;
    }

    const hf = new InferenceClient(context.auth as string);

    const args: SummarizationArgs = {
      model: model,
      inputs: text,
      options: {
        use_cache: useCache ?? true,
        wait_for_model: waitForModel ?? false,
      },
    };

    // Build parameters object
    const parameters: {
      clean_up_tokenization_spaces?: boolean;
      truncation?:
        | 'do_not_truncate'
        | 'longest_first'
        | 'only_first'
        | 'only_second';
      generate_parameters?: {
        min_length?: number;
        max_length?: number;
        do_sample?: boolean;
        temperature?: number;
      };
    } = {};

    if (cleanUpSpaces !== undefined) {
      parameters.clean_up_tokenization_spaces = cleanUpSpaces;
    }

    if (
      truncationStrategy &&
      (truncationStrategy === 'do_not_truncate' ||
        truncationStrategy === 'longest_first' ||
        truncationStrategy === 'only_first' ||
        truncationStrategy === 'only_second')
    ) {
      parameters.truncation = truncationStrategy;
    }

    // Add generation parameters
    parameters.generate_parameters = {
      min_length: minLength,
      max_length: maxLength,
      do_sample: false, // Use greedy decoding for consistent summaries
      temperature: 0.7, // Slight randomness for more natural summaries
    };

    if (Object.keys(parameters).length > 0) {
      args.parameters = parameters;
    }

    const summarizationResult = await hf.summarization(args);

    // Calculate text statistics
    const originalLength = text.length;
    const originalWords = text.trim().split(/\s+/).length;
    const summaryText = summarizationResult.summary_text;
    const summaryWords = summaryText.trim().split(/\s+/).length;
    const compressionRatio = (
      ((originalWords - summaryWords) / originalWords) *
      100
    ).toFixed(1);

    return {
      summary: summaryText,
      originalText: text,
      statistics: {
        originalLength: originalLength,
        originalWords: originalWords,
        summaryLength: summaryText.length,
        summaryWords: summaryWords,
        compressionRatio: `${compressionRatio}%`,
        lengthCategory: summaryLength,
      },
      model: model,
      contentType: contentType,
      businessInsights: {
        readingTimeSaved: `${Math.max(
          1,
          Math.round((originalWords - summaryWords) / 200)
        )} minutes`, // Assume 200 words per minute
        useCase: getSuggestedUseCase(contentType),
        qualityTips: getQualityTips(originalWords, summaryWords),
      },
      rawResult: summarizationResult,
    };
  },
});

// Helper function to suggest business use cases
function getSuggestedUseCase(contentType: string): string {
  const useCases = {
    news: 'Perfect for news briefings, blog post previews, and content curation',
    email: 'Ideal for customer support dashboards and email triage systems',
    meeting:
      'Great for meeting minutes, call summaries, and action item extraction',
    general: 'Suitable for document summaries and knowledge base creation',
    medical: 'Designed for medical reports and research paper abstracts',
    multilingual:
      'Perfect for global content management and translation workflows',
    search: 'Custom model selection for specialized summarization needs',
  };
  return (
    useCases[contentType as keyof typeof useCases] ||
    'General purpose text summarization'
  );
}

// Helper function to provide quality tips
function getQualityTips(originalWords: number, summaryWords: number): string[] {
  const tips: string[] = [];

  if (originalWords < 100) {
    tips.push('⚠️ Text is quite short - summaries work best with 200+ words');
  }

  if (originalWords > 2000) {
    tips.push(
      '📝 Very long text - consider breaking into sections for better results'
    );
  }

  if (summaryWords / originalWords > 0.7) {
    tips.push(
      '💡 Summary is quite long - try Brief mode for more concise results'
    );
  }

  if (summaryWords / originalWords < 0.1) {
    tips.push(
      '🔍 Very aggressive summarization - try Medium or Detailed for more context'
    );
  }

  if (tips.length === 0) {
    tips.push('✅ Good summarization ratio achieved');
  }

  return tips;
}
