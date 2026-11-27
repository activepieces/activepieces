import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiGeminiGenerateContentOutputSchema } from '../../../output-schemas';

export const geminiGenerateContentAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_gemini_generate_content',
  outputSchema: cometapiGeminiGenerateContentOutputSchema,
  displayName: 'Gemini Generate Content',
  description:
    'Generates text or images with a Gemini model using the native Gemini format.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Runs a native Gemini generateContent request through CometAPI: text, multimodal input, Google Search grounding, JSON output and, on Gemini image models, image output returned inline as base64. Contents follows the Gemini format; pass tools or safety settings through Additional Fields. Each call runs a fresh, billed generation.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.model({
      required: true,
      description:
        'Gemini model ID, e.g. "gemini-2.5-flash". Use List Models to find one.',
    }),
    contents: Property.Json({
      displayName: 'Contents',
      description:
        'The request body\'s contents in Gemini format, wrapped in an object: {"contents": [{"role": "user", "parts": [{"text": "Hello"}]}]}.',
      required: true,
    }),
    systemInstruction: Property.LongText({
      displayName: 'System Instruction',
      required: false,
    }),
    generationConfig: Property.Json({
      displayName: 'Generation Config',
      description:
        'Gemini generationConfig object, e.g. {"temperature": 0.2, "responseMimeType": "application/json"}.',
      required: false,
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const contents = propsValue.contents['contents'];
    if (!Array.isArray(contents)) {
      throw new Error(
        'Contents must be an object with a "contents" array, e.g. {"contents": [{"role": "user", "parts": [{"text": "Hello"}]}]}.'
      );
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: `/v1beta/models/${encodeURIComponent(
        propsValue.model
      )}:generateContent`,
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          contents,
          systemInstruction: propsValue.systemInstruction
            ? { parts: [{ text: propsValue.systemInstruction }] }
            : undefined,
          generationConfig: propsValue.generationConfig,
        },
      }),
    });
  },
});
