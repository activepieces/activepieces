import { createAction, Property } from "@activepieces/pieces-framework";
import { BumpupsAuth } from "../common/auth";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";

export const sendChat = createAction({
  name: 'send_chat',
  displayName: 'Send Chat',
  description:
    'Creates an interactive chat response for a given YouTube video using the bump-1.0 model. Provide the video URL and an optional prompt.',
  auth: BumpupsAuth,
  props: {
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'The YouTube video URL.',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      defaultValue: 'bump-1.0',
      options: {
        disabled: false,
        options: [
          { label: 'bump-1.0', value: 'bump-1.0' },
        ],
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'Message or query about the video (max 500 chars). If empty, defaults to "summary".',
      required: false,
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      required: false,
      defaultValue: 'en',
      options: {
        disabled: false,
        options: [
          { label: 'English (en)', value: 'en' },
          { label: 'Hindi (hi)', value: 'hi' },
          { label: 'Spanish (es)', value: 'es' },
          { label: 'Portuguese (pt)', value: 'pt' },
          { label: 'Russian (ru)', value: 'ru' },
          { label: 'German (de)', value: 'de' },
          { label: 'French (fr)', value: 'fr' },
          { label: 'Japanese (ja)', value: 'ja' },
          { label: 'Korean (ko)', value: 'ko' },
          { label: 'Arabic (ar)', value: 'ar' },
        ],
      },
    }),
    output_format: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      defaultValue: 'text',
      options: {
        disabled: false,
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Markdown', value: 'markdown' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const body = {
      url: propsValue.videoUrl,
      model: propsValue.model,
      prompt: propsValue.prompt || 'summary',
      language: propsValue.language || 'en',
      output_format: propsValue.output_format || 'text',
    };

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/chat',
      body
    );

    return response;
  },
});
