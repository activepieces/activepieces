import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { grokApiCall } from '../common/client';
import { grokAuth } from '../common/auth';
import { modelIdDropdown } from '../common/props';

export const extractDataFromTextAction = createAction({
  auth: grokAuth,
  name: 'extract_data_from_text',
  displayName: 'Extract Data From Text',
  description:
    'Extract structured data fields from unstructured text (e.g., names, addresses).',
  props: {
    model: modelIdDropdown,
    text_to_process: Property.LongText({
      displayName: 'Text to Process',
      description: 'The unstructured text you want to extract data from.',
      required: true,
    }),
    schema: Property.Json({
      displayName: 'Extraction Schema (JSON)',
      description:
        'Define the JSON structure for the data you want to extract. Use keys for field names and empty strings or null as placeholders.',
      required: true,
      defaultValue: {
        name: '',
        email: '',
        phone_number: '',
        company: '',
        summary: 'A brief summary of the text.',
      },
    }),
    instructions: Property.LongText({
      displayName: 'Additional Instructions',
      description:
        'Optional instructions to guide the extraction process (e.g., "The phone number is always in international format.", "Extract all mentioned product names into an array.").',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { model, text_to_process, schema, instructions } = propsValue;

    const system_prompt = `
You are a highly intelligent data extraction AI. Your sole purpose is to analyze the user's text and extract information according to the provided JSON schema.

RULES:
- You MUST return a single, valid JSON object.
- The keys in your response MUST exactly match the keys in the provided schema.
- If a piece of information for a specific key cannot be found in the text, you MUST use a null value for that key. Do not make up information.
- The required output format is this exact JSON structure: ${JSON.stringify(
      schema
    )}
${instructions || ''}
    `;

    const messages = [
      { role: 'system', content: system_prompt },
      { role: 'user', content: text_to_process },
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
          'Invalid request parameters. Please check your model selection, text input, and schema format.'
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

      throw new Error(`Failed to extract data: ${error.message}`);
    }
  },
});
