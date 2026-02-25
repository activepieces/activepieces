import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest, AuthenticationType } from '@activepieces/pieces-common';
import { vertexAiAuth, GoogleVertexAIAuthValue } from '../auth';
import { getCachedAccessToken } from '../common/auth';

export const generateContent = createAction({
  auth: vertexAiAuth,
  name: 'generate_content',
  displayName: 'Generate Content',
  description: 'Call a Gemini model on Vertex AI to generate a text response.',
  props: {
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Google Cloud region where your Vertex AI resources are hosted (e.g., us-central1).',
      required: false,
      defaultValue: 'us-central1',
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Vertex AI model to use (e.g., gemini-2.5-flash, gemini-3-flash-preview).',
      required: false,
      defaultValue: 'gemini-2.5-flash',
    }),
    systemMessage: Property.LongText({
      displayName: 'System Message',
      description: 'Instructions that guide the model\'s behavior throughout the conversation.',
      required: false,
    }),
    userMessage: Property.LongText({
      displayName: 'User Message',
      description: 'The prompt to send to the model.',
      required: true,
    }),
    imageUrls: Property.Array({
      displayName: 'Image URLs',
      description: 'Public image URLs to include in the request (https://...). The model will see these images alongside the user message.',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Controls randomness. Lower values are more deterministic (0–2). Leave empty to use the model default.',
      required: false,
    }),
    maxOutputTokens: Property.Number({
      displayName: 'Max Output Tokens',
      description: 'Maximum number of tokens to generate. Leave empty to use the model default.',
      required: false,
    }),
    thinkingLevel: Property.StaticDropdown({
      displayName: 'Thinking Level (Gemini 3+)',
      description: 'Controls how much the model thinks before responding. Use with Gemini 3 and later models. Ignored if Thinking Budget is set.',
      required: false,
      options: {
        options: [
          { label: 'None (disabled)', value: 'NONE' },
          { label: 'Minimal', value: 'MINIMAL' },
          { label: 'Default', value: 'DEFAULT' },
          { label: 'Maximum', value: 'MAXIMUM' },
        ],
      },
    }),
    thinkingBudget: Property.Number({
      displayName: 'Thinking Budget (Gemini 2.5 and earlier)',
      description: 'Number of tokens the model can use for its internal reasoning before responding. Use with Gemini 2.5 and earlier models.',
      required: false,
    }),
    includeThoughts: Property.Checkbox({
      displayName: 'Include Thoughts in Response (Gemini 2.5 and earlier)',
      description: 'When enabled, the model\'s reasoning tokens are returned alongside the final response. Use with Gemini 2.5 and earlier models.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      location, model, systemMessage, userMessage, imageUrls,
      temperature, maxOutputTokens,
      thinkingLevel, thinkingBudget, includeThoughts,
    } = context.propsValue;
    const auth = context.auth as GoogleVertexAIAuthValue;

    const { accessToken, projectId } = await getCachedAccessToken(
      auth.props.serviceAccountJson,
      context.store
    );

    const url = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

    const parts: Record<string, unknown>[] = [{ text: userMessage }];

    for (const imageUrl of (imageUrls as string[] | undefined) ?? []) {
      try {
        const headResponse = await fetch(imageUrl, { method: 'HEAD' });
        const mimeType = headResponse.headers.get('content-type') ?? 'image/jpeg';
        parts.push({ fileData: { mimeType, fileUri: imageUrl } });
      } catch (err) {
        throw new Error(
          `Failed to resolve image URL (${imageUrl}): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    const requestBody: Record<string, unknown> = {
      contents: [{ role: 'user', parts }],
    };

    if (systemMessage) {
      requestBody['systemInstruction'] = {
        parts: [{ text: systemMessage }],
      };
    }

    const generationConfig: Record<string, unknown> = {};

    if (temperature !== undefined && temperature !== null) {
      generationConfig['temperature'] = temperature;
    }
    if (maxOutputTokens !== undefined && maxOutputTokens !== null) {
      generationConfig['maxOutputTokens'] = maxOutputTokens;
    }

    const versionMatch = (model ?? '').match(/gemini-(\d+)/i);
    const geminiMajorVersion = versionMatch ? parseInt(versionMatch[1], 10) : 0;
    const isGemini3Plus = geminiMajorVersion >= 3;

    if (isGemini3Plus) {
      if (thinkingLevel) {
        generationConfig['thinkingConfig'] = { thinkingLevel };
      }
    } else {
      const hasThinkingBudget = thinkingBudget !== undefined && thinkingBudget !== null;
      if (hasThinkingBudget || includeThoughts) {
        const thinkingConfig: Record<string, unknown> = {};
        if (hasThinkingBudget) {
          thinkingConfig['thinkingBudget'] = thinkingBudget;
        }
        if (includeThoughts) {
          thinkingConfig['includeThoughts'] = true;
        }
        generationConfig['thinkingConfig'] = thinkingConfig;
      }
    }

    if (Object.keys(generationConfig).length > 0) {
      requestBody['generationConfig'] = generationConfig;
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
