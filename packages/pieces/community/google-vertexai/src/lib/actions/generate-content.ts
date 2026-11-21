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
  classification: 'READ',
  displayName: 'Generate Content',
  description: 'Call a Gemini model on Vertex AI to generate a text response.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a prompt (with optional system instruction) to a Gemini model on Google Vertex AI and returns the generated text. Multimodal: you can attach files, public image URLs, or a YouTube video URL for the model to analyze alongside the prompt. Use for free-form text generation, summarization, extraction, or analysis of supplied media. Requires a Vertex AI service-account credential and a region/model selection. Not idempotent — each call is a fresh generation and output varies (especially with non-zero temperature).',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['userMessage', 'systemMessage'],
    },
    {
      key: 'settings',
      display: 'section',
      label: 'Settings',
      icon: 'sliders',
      props: ['location', 'model'],
    },
    {
      key: 'attachments',
      display: 'section',
      label: 'Attachments',
      icon: 'paperclip',
      props: ['files', 'imageUrls', 'youtubeUrl'],
    },
  ],
  props: {
    location: Property.Dropdown({
      displayName: 'Location',
      description: 'Google Cloud region that runs the model.',
      required: true,
      refreshers: [],
      defaultValue: 'us-central1',
      auth: vertexAiAuth,
      options: async ({ auth }) =>
        getVertexAILocationOptions(auth as GoogleVertexAIAuthValue | undefined),
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      description: 'Gemini model that writes the response.',
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
      displayName: 'System Instructions',
      description: 'How the model should behave, such as its role or tone.',
      placeholder: 'You are a helpful assistant that answers in short bullet points.',
      required: false,
    }),
    userMessage: Property.LongText({
      displayName: 'Prompt',
      description: 'What you want the model to write or answer.',
      placeholder: 'Summarize this customer email in three bullet points.',
      required: true,
    }),
    files: Property.Array({
      displayName: 'Files',
      required: false,
      description: 'Images, PDFs, text, audio or video for the model to read.',
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
      description: 'Public YouTube video the model watches.',
      placeholder: 'https://www.youtube.com/watch?v=...',
    }),
    imageUrls: Property.Array({
      displayName: 'Image URLs',
      description: 'Public image links the model looks at.',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'From 0 to 2; lower gives steadier answers. Empty: model default.',
      required: false,
      advanced: true,
    }),
    maxOutputTokens: Property.Number({
      displayName: 'Max Output Tokens',
      description: 'Longest reply, in tokens. Empty: model default.',
      required: false,
      advanced: true,
    }),
    thinkingLevel: Property.StaticDropdown({
      displayName: 'Thinking Level',
      description: 'Gemini 3 models only. Leave empty when using Thinking Budget.',
      required: false,
      advanced: true,
      options: {
        options: [
          { label: 'Low', value: ThinkingLevel.LOW },
          { label: 'Medium', value: ThinkingLevel.MEDIUM },
          { label: 'High', value: ThinkingLevel.HIGH },
        ],
      },
    }),
    thinkingBudget: Property.Number({
      displayName: 'Thinking Budget',
      description: 'Reasoning tokens for Gemini 2.5 models; 0 turns it off where allowed.',
      required: false,
      advanced: true,
    }),
    includeThoughts: Property.Checkbox({
      displayName: 'Include Thoughts',
      description: "Adds the model's reasoning summary to the Candidates output.",
      required: false,
      advanced: true,
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