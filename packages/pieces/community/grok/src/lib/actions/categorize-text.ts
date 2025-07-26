import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { grokApiCall } from '../common/client';
import { grokAuth } from '../common/auth';
import { modelIdDropdown } from '../common/props';

export const categorizeTextAction = createAction({
  auth: grokAuth,
  name: 'categorize-text',
  displayName: 'Categorize Text',
  description:
    'Assign one or more categories to input text based on custom labels.',
  props: {
    model: modelIdDropdown,
    text_to_categorize: Property.LongText({
      displayName: 'Text to Categorize',
      required: true,
    }),
    categories: Property.Array({
      displayName: 'Categories',
      description: 'A list of possible categories to assign to the text.',
      required: true,
    }),
    instructions: Property.LongText({
      displayName: 'Additional Instructions',
      description:
        'Optional instructions to guide the categorization process (e.g., "Only return the single most relevant category").',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { model, text_to_categorize, categories, instructions } = propsValue;

    const system_prompt = `
You are an expert text categorization AI. Your task is to analyze the user's text and assign it to one or more of the available categories.

RULES:
- You MUST only choose from the following list of categories: ${JSON.stringify(
      categories
    )}
- You MUST return your response as a valid JSON object in the following format: {"categories": ["category1", "category2"]}
- If no categories seem appropriate, return an empty array: {"categories": []}
${instructions || ''}
    `;

    const messages = [
      { role: 'system', content: system_prompt },
      { role: 'user', content: text_to_categorize },
    ];

    try {
      const response = await grokApiCall<{
        choices: { message: { content: string } }[];
      }>({
        method: HttpMethod.POST,
        auth,
        resourceUri: '/chat/completions',
        body: {
          model: model,
          messages: messages,
          temperature: 0,
        },
      });

      const rawResponse = response.choices[0].message.content;

      try {
        return JSON.parse(rawResponse);
      } catch (jsonError) {
        throw new Error(
          `Failed to parse AI response as JSON. Raw response: ${rawResponse}`
        );
      }
    } catch (error: any) {
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your model selection, text input, and categories format.'
        );
      }

      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed or insufficient permissions. Please check your API key and account access.'
        );
      }

      if (error.message.includes('404')) {
        throw new Error(
          'Model or endpoint not found. Please verify the model exists and you have access to it.'
        );
      }

      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to categorize text: ${error.message}`);
    }
  },
});
