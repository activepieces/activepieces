import { createAction, Property } from '@activepieces/pieces-framework';
import { GoogleGenAI, ContentListUnion, createPartFromBase64, createPartFromUri } from '@google/genai';
import mime from 'mime-types';
import { ApFile } from '@activepieces/pieces-framework';

interface ServiceAccountAuth {
  serviceAccountJson: string;
}

interface FileItem {
  file: ApFile;
}

export const generateContentWithGemini = createAction({
  name: 'generateContentWithGemini',
  displayName: 'Generate Content with Gemini',
  description: 'Generate content using Google Vertex AI Gemini model.',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      description: 'See https://cloud.google.com/vertex-ai/generative-ai/docs/models for model capabilities and limitations.',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash-preview-04-17' },
            { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro-preview-05-06' },
            { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
            { label: 'Gemini 2.0 Flash-Lite', value: 'gemini-2.0-flash-lite' },
          ],
        };
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'Your instructions for the AI to follow',
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
      description: 'Optional public YouTube video URL for the AI to use as a reference',
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description: 'Controls randomness: 0 is more deterministic, 1 is more random',
      defaultValue: 0,
    })
  },
  async run(context) {
    const auth = context.auth as ServiceAccountAuth;
    const serviceAccountJson = JSON.parse(auth.serviceAccountJson);
    const { model, prompt, files, youtubeUrl, temperature } = context.propsValue;

    const ai = new GoogleGenAI({
      vertexai: true,
      googleAuthOptions: {
        credentials: serviceAccountJson,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      },
      project: serviceAccountJson.project_id,
      location: 'us-central1'
    });

    const generationConfig = {
      temperature
    };

    const contentParts: ContentListUnion = [{ text: prompt }];
    
    if (files && files.length > 0) {
      for (const file of files as FileItem[]) {
        const base64Data = file.file.data.toString('base64');
        const mimeType = mime.lookup(file.file.extension || '') || 'application/octet-stream';
        contentParts.push(createPartFromBase64(base64Data, mimeType));
      }
    }

    if (youtubeUrl) {
      contentParts.push(createPartFromUri(youtubeUrl, 'video/mp4'));
    }

    const result = await ai.models.generateContent({
      model,
      config: generationConfig,
      contents: contentParts
    });
    
    return {
      response: result
    };
  },
});
