import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  propsValidation,
} from '@activepieces/pieces-common';
import { grokAuth } from '../common/auth';
import { 
  createModelProperty, 
  createTemperatureProperty,
  createTokenProperty,
  createSearchProperties,
  createAdvancedProperties,
  makeXaiRequest,
  validateResponse,
  parseJsonResponse,
  buildSearchParameters,
  shouldUseReasoningEffort,
  XaiResponse,
  CategorizationResult
} from '../common/utils';
import { z } from 'zod';

interface Category {
  name: string;
  description: string;
}

export const categorizeText = createAction({
  auth: grokAuth,
  name: 'categorize_text',
  displayName: 'Categorize Text',
  description: 'Assign one or more categories to input text based on custom or predefined labels using advanced AI categorization.',
  props: {
    model: createModelProperty({
      displayName: 'Model',
      description: 'The Grok model to use for text categorization.',
      defaultValue: 'grok-3-beta'
    }),
    text: Property.LongText({
      displayName: 'Text to Categorize',
      required: true,
      description: 'The text content you want to categorize.',
    }),
    categories: Property.Array({
      displayName: 'Categories',
      required: true,
      description: 'Define the categories for classification.',
      properties: {
        name: Property.ShortText({
          displayName: 'Category Name',
          required: true,
          description: 'Name of the category (e.g., "Positive", "Urgent", "Customer Support")',
        }),
        description: Property.ShortText({
          displayName: 'Category Description',
          required: true,
          description: 'Brief description of what this category represents',
        }),
      },
    }),
    allowMultiple: Property.Checkbox({
      displayName: 'Allow Multiple Categories',
      required: false,
      defaultValue: false,
      description: 'Whether the text can be assigned to multiple categories.',
    }),
    includeConfidence: Property.Checkbox({
      displayName: 'Include Confidence Scores',
      required: false,
      defaultValue: true,
      description: 'Include confidence scores for each category assignment.',
    }),
    customInstructions: Property.LongText({
      displayName: 'Custom Instructions',
      required: false,
      description: 'Additional instructions for categorization (e.g., specific criteria, context).',
      defaultValue: 'Analyze the text and assign it to the most appropriate category based on its content, tone, and context.',
    }),
    enableContextSearch: Property.Checkbox({
      displayName: 'Enable Context Search',
      required: false,
      defaultValue: false,
      description: 'Allow the model to search for additional context to improve categorization.',
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description: 'Controls randomness (0-2): 0 = deterministic, 1 = balanced, 2 = creative.',
      defaultValue: 0.2,
    }),
    maxCompletionTokens: Property.Number({
      displayName: 'Max Completion Tokens',
      required: false,
      description: 'Maximum tokens for the categorization response.',
      defaultValue: 500,
    }),
    reasoningEffort: Property.StaticDropdown({
      displayName: 'Reasoning Effort',
      required: false,
      description: 'How thoroughly the model should analyze the text.',
      options: {
        disabled: false,
        options: [
          { label: 'Default', value: '' },
          { label: 'Low (Quick analysis)', value: 'low' },
          { label: 'High (Deep analysis)', value: 'high' },
        ],
      },
    }),
    includeCitations: Property.Checkbox({
      displayName: 'Include Citations',
      required: false,
      defaultValue: false,
      description: 'Include sources if context search is enabled.',
    }),
    user: Property.ShortText({
      displayName: 'User ID',
      required: false,
      description: 'Unique identifier for tracking (helps monitor usage patterns).',
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      temperature: z.number().min(0).max(2).optional(),
      maxCompletionTokens: z.number().min(50).max(4000).optional(),
      text: z.string().min(1).max(100000),
    });

    const {
      model,
      text,
      categories,
      allowMultiple,
      includeConfidence,
      customInstructions,
      enableContextSearch,
      temperature,
      maxCompletionTokens,
      reasoningEffort,
      includeCitations,
      user,
    } = propsValue;

    if (!text.trim()) {
      throw new Error('Text to categorize cannot be empty');
    }

    const categoriesArray = categories as Category[];

    if (!categoriesArray || categoriesArray.length === 0) {
      throw new Error('At least one category must be defined');
    }

    const categoryNames = categoriesArray.map(cat => cat.name);
    const categoryDescriptions = categoriesArray.map(cat => 
      `${cat.name}: ${cat.description}`
    ).join('\n');

    const jsonSchema = {
      type: "object",
      properties: {
        categories: {
          type: "array",
          items: {
            type: "string",
            enum: categoryNames,
          },
          description: allowMultiple 
            ? "Array of category names that apply to the text"
            : "Single category name that best applies to the text",
          maxItems: allowMultiple ? categoryNames.length : 1,
          minItems: 1,
        },
        reasoning: {
          type: "string",
          description: "Detailed explanation of why these categories were chosen",
        },
        ...(includeConfidence ? {
          confidence_scores: {
            type: "object",
            properties: Object.fromEntries(
              categoryNames.map(name => [
                name.toLowerCase().replace(/\s+/g, '_'),
                {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                  description: `Confidence score for ${name} category (0-1)`,
                }
              ])
            ),
            description: "Confidence scores for each category",
          }
        } : {}),
      },
      required: ["categories", "reasoning"],
      additionalProperties: false,
    };

    const systemPrompt = `You are an expert text categorization system. Your task is to analyze text and assign it to appropriate categories.

${customInstructions}

Available Categories:
${categoryDescriptions}

Categorization Rules:
- ${allowMultiple ? 'You may assign multiple categories if the text fits multiple classifications' : 'You must assign exactly ONE category that best fits the text'}
- Analyze the content, tone, intent, and context of the text
- ${includeConfidence ? 'Provide confidence scores between 0 and 1 for each category' : ''}
- Always provide clear reasoning for your categorization decision
- Be consistent with the category definitions provided
- If the text doesn't clearly fit any category, choose the closest match and explain why

Response Format: You must respond with valid JSON matching the specified schema.`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Please categorize the following text:\n\n${text.trim()}`,
      },
    ];

    const requestBody: any = {
      model,
      messages,
      temperature: temperature || 0.2,
      max_completion_tokens: maxCompletionTokens || 500,
      response_format: {
        type: 'json_schema',
        json_schema: jsonSchema,
      },
    };

    if (user) {
      requestBody.user = user;
    }

    if (reasoningEffort && !model.includes('grok-3')) {
      requestBody.reasoning_effort = reasoningEffort;
    }

    if (enableContextSearch) {
      requestBody.search_parameters = {
        mode: 'auto',
        max_search_results: 5,
        return_citations: includeCitations,
      };
    }

    try {
      const response = await makeXaiRequest(auth, requestBody, 120000, 'Categorize Text');
      const { choice, content } = validateResponse(response, 'Categorize Text');
      const categorizationResult = parseJsonResponse(content, 'Categorize Text');

      const result = {
        categories: categorizationResult.categories || [],
        reasoning: categorizationResult.reasoning || '',
        primary_category: Array.isArray(categorizationResult.categories) 
          ? categorizationResult.categories[0] 
          : categorizationResult.categories,
        multiple_categories: allowMultiple,
        total_categories_assigned: Array.isArray(categorizationResult.categories) 
          ? categorizationResult.categories.length 
          : 1,
        model: response.body.model,
        finish_reason: choice.finish_reason,
      };

      if (includeConfidence && categorizationResult.confidence_scores) {
        (result as any).confidence_scores = categorizationResult.confidence_scores;
        
        const confidenceValues = Object.values(categorizationResult.confidence_scores) as number[];
        if (confidenceValues.length > 0) {
          (result as any).avg_confidence = confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length;
          (result as any).max_confidence = Math.max(...confidenceValues);
          (result as any).min_confidence = Math.min(...confidenceValues);
        }
      }

      if (response.body.usage) {
        (result as any).usage = response.body.usage;
      }

      if (includeCitations && response.body.citations) {
        (result as any).citations = response.body.citations;
      }

      if (choice.message.reasoning_content) {
        (result as any).reasoning_content = choice.message.reasoning_content;
      }

      return result as CategorizationResult;
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorMessage = error.response?.body?.error?.message || 'Bad request';
        throw new Error(`Text categorization failed: ${errorMessage}`);
      }
      
      if (error.response?.status === 422) {
        const errorMessage = error.response?.body?.error?.message || 'Validation error';
        throw new Error(`Invalid categorization parameters: ${errorMessage}`);
      }

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      if (error.response?.status === 500) {
        throw new Error('Categorization service temporarily unavailable. Please try again.');
      }

      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your xAI API key.');
      }

      if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your API key permissions.');
      }

      if (error.message?.includes('timeout')) {
        throw new Error('Categorization timed out. Try reducing text length or simplifying categories.');
      }

      throw new Error(`Text categorization failed: ${error.message || 'Unknown error occurred'}`);
    }
  },
}); 