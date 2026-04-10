import { createAction, Property, ApFile } from '@activepieces/pieces-framework';
import {
  GenerateContentConfig,
  GoogleGenAI,
  Part,
  ThinkingConfig,
  ThinkingLevel,
} from '@google/genai';
import mime from 'mime-types';
import { vertexAiAuth, GoogleVertexAIAuthValue } from '../auth';
import { getVertexAIModelOptions, getVertexAILocationOptions } from '../common';

interface FileItem {
  file: ApFile;
}

export const generateContent = createAction({
  auth: vertexAiAuth,
  name: 'generate_content',
  displayName: 'Generate Content',
  description: 'Call a Gemini model on Vertex AI to generate a text response.',
  props: {
    location: Property.Dropdown({
      displayName: 'Location',
      description: 'Google Cloud region where your Vertex AI resources are hosted.',
      required: true,
      refreshers: [],
      defaultValue: 'us-central1',
      auth: vertexAiAuth,
      options: async ({ auth }) =>
        getVertexAILocationOptions(auth as GoogleVertexAIAuthValue | undefined),
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      description: 'Gemini model to use for content generation.',
      required: true,
      refreshers: ['location'],
      defaultValue: 'gemini-2.5-flash',
      auth: vertexAiAuth,
      options: async ({ auth, location }) =>
        getVertexAIModelOptions(
          auth as GoogleVertexAIAuthValue | undefined,
          location as string | undefined
        ),
    }),
    systemMessage: Property.LongText({
      displayName: 'System Message',
      description: "Instructions that guide the model's behavior throughout the conversation.",
      required: false,
    }),
    userMessage: Property.LongText({
      displayName: 'User Message',
      description: 'The prompt to send to the model.',
      required: true,
    }),
    files: Property.Array({
      displayName: 'Files',
      required: false,
      description: 'Optional files to include in the prompt (images, PDFs, text, audio, video)',
      properties: {
        file: Property.File({
          displayName: 'File',
          required: true,
        })
      }
    }),
    youtubeUrl: Property.ShortText({
      displayName: 'YouTube URL',
      required: false,
      description: 'Optional public YouTube video URL for the AI to use as a reference.',
    }),
    imageUrls: Property.Array({
      displayName: 'Image URLs',
      description:
        'Public image URLs to include alongside the user message. The model will analyze these images.',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description:
        'Controls randomness. Lower values are more deterministic (0–2). Leave empty to use the model default.',
      required: false,
    }),
    maxOutputTokens: Property.Number({
      displayName: 'Max Output Tokens',
      description: 'Maximum number of tokens to generate. Leave empty to use the model default.',
      required: false,
    }),
    thinkingLevel: Property.StaticDropdown({
      displayName: 'Thinking Level',
      description:
        'Controls how much the model thinks before responding. Supported on Gemini 2.5 and later models.',
      required: false,
      options: {
        options: [
          { label: 'Low', value: ThinkingLevel.LOW },
          { label: 'Medium', value: ThinkingLevel.MEDIUM },
          { label: 'High', value: ThinkingLevel.HIGH },
        ],
      },
    }),
    thinkingBudget: Property.Number({
      displayName: 'Thinking Budget (tokens)',
      description:
        'Maximum number of tokens the model can use for internal reasoning. Set to 0 to disable thinking. Supported on Gemini 2.5 and later models.',
      required: false,
    }),
    includeThoughts: Property.Checkbox({
      displayName: 'Include Thoughts in Response',
      description:
        "When enabled, the model's reasoning is returned alongside the final response. Supported on Gemini 2.5 and later models.",
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      location,
      model,
      systemMessage,
      userMessage,
      files,
      youtubeUrl,
      imageUrls,
      temperature,
      maxOutputTokens,
      thinkingLevel,
      thinkingBudget,
      includeThoughts,
    } = context.propsValue;
    const auth = context.auth as GoogleVertexAIAuthValue;

    const rawCredentials = JSON.parse(auth.props.serviceAccountJson);
    const credentials = {
      ...rawCredentials,
      private_key: rawCredentials.private_key?.replace(/\\n/g, '\n'),
    };

    const ai = new GoogleGenAI({
      vertexai: true,
      project: credentials.project_id,
      location: location,
      googleAuthOptions: {
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      },
    });

    const parts: Part[] = [{ text: userMessage }];

    if (files && files.length > 0) {
      for (const item of files as FileItem[]) {
        if (item.file && item.file.data) {
          const base64Data = Buffer.from(item.file.data).toString('base64');
          const mimeType = mime.lookup(item.file.extension || '') || 'application/octet-stream';
          parts.push({ inlineData: { data: base64Data, mimeType } });
        }
      }
    }

    if (youtubeUrl) {
      parts.push({ fileData: { fileUri: youtubeUrl, mimeType: 'video/mp4' } });
    }

    for (const imageUrl of (imageUrls as string[] | undefined) ?? []) {
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`HTTP ${imageResponse.status} ${imageResponse.statusText}`);
        }
        const arrayBuffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = imageResponse.headers.get('content-type') ?? 'image/jpeg';
        parts.push({ inlineData: { data: base64, mimeType } });
      } catch (err) {
        throw new Error(
          `Failed to fetch image (${imageUrl}): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    const config: GenerateContentConfig = {};

    if (systemMessage) {
      config.systemInstruction = systemMessage;
    }
    if (temperature !== undefined && temperature !== null) {
      config.temperature = temperature;
    }
    if (maxOutputTokens !== undefined && maxOutputTokens !== null) {
      config.maxOutputTokens = maxOutputTokens;
    }

    const thinkingConfig: ThinkingConfig = {};
    let hasThinkingConfig = false;

    if (thinkingLevel) {
      thinkingConfig.thinkingLevel = thinkingLevel as ThinkingLevel;
      hasThinkingConfig = true;
    }
    if (thinkingBudget !== undefined && thinkingBudget !== null) {
      thinkingConfig.thinkingBudget = thinkingBudget;
      hasThinkingConfig = true;
    }
    if (includeThoughts) {
      thinkingConfig.includeThoughts = true;
      hasThinkingConfig = true;
    }
    if (hasThinkingConfig) {
      config.thinkingConfig = thinkingConfig;
    }

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts }],
      config,
    });

    const candidate = response.candidates?.[0];
    if (candidate) {
      const finishReason = candidate.finishReason;
      if (finishReason !== 'STOP') {
        if (finishReason === 'MAX_TOKENS') {
          throw new Error(`Generation stopped due to token limit. Consider removing the max output tokens or shortening your prompt.`);
        }
      }
    }

    return {
      text: response.text,
      candidates: response.candidates,
      usageMetadata: response.usageMetadata,
    };
  },
});