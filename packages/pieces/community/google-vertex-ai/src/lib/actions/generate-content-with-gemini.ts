import { createAction, Property } from '@activepieces/pieces-framework';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { GoogleAuth } from 'google-auth-library';

interface ServiceAccountAuth {
  serviceAccountJson: string;
}

export const generateContentWithGemini = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'generateContentWithGemini',
  displayName: 'Generate Content with Gemini',
  description: 'Generate content using Google Vertex AI Gemini model',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Gemini Pro', value: 'gemini-pro' },
            { label: 'Gemini Pro Vision', value: 'gemini-pro-vision' },
            { label: 'Gemini 2.5 Pro Preview', value: 'gemini-2.5-pro-preview-05-06' },
          ],
        };
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The prompt to generate content from',
    }),
    maxOutputTokens: Property.Number({
      displayName: 'Max Output Tokens',
      required: false,
      description: 'Maximum number of tokens to generate',
      defaultValue: 2048,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description: 'Controls randomness: 0 is deterministic, 1 is creative',
      defaultValue: 0,
    })
  },
  async run(context) {
    const auth = context.auth as ServiceAccountAuth;
    const serviceAccountJson = JSON.parse(auth.serviceAccountJson);
    const { model, prompt, maxOutputTokens, temperature } = context.propsValue;

    // Initialize Gemini client with service account
    const ai = new GoogleGenAI({
      vertexai: true,
      googleAuthOptions: {
        credentials: serviceAccountJson,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      },
      project: serviceAccountJson.project_id,
      location: 'us-central1' // Default location, can be made configurable if needed
    });

    // Set up generation config
    const generationConfig = {
      maxOutputTokens,
      temperature
    };

    const result = await ai.models.generateContent({
      model,
      config: generationConfig,
      contents: prompt
    });
    
    return {
      response: result
    };
  },
});
