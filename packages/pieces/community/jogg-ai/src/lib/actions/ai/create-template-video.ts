import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../../..';
import { joggAiClient } from '../../common/client';
import { joggAiOutputSchemas } from '../../common/output-schemas';

export const aiCreateTemplateVideo = createAction({
  auth: joggAiAuth,
  name: 'ai_create_template_video',
  displayName: 'Create Template Video',
  description: 'Starts rendering a video from one of your templates.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: joggAiOutputSchemas.aiCreateVideo,
  aiMetadata: {
    description:
      'Starts rendering a video from a custom JoggAI template and returns its video_id. Get the template_id from List Templates and the variable names and types from Get Template, then pass variables as a list of {type, name, content or url}: text and script variables take content, image and video variables take a public url. Avatar and voice are optional overrides. Rendering is async and spends credits: poll Get Template Video. Not idempotent: every call queues and bills a new video.',
    idempotent: false,
  },
  props: {
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'Numeric template_id from List Templates.',
      required: true,
    }),
    voice_language: Property.ShortText({
      displayName: 'Voice Language',
      description: 'Language of the speech, e.g. english.',
      required: true,
    }),
    variables: Property.Json({
      displayName: 'Variables',
      description:
        'List of template variables, e.g. [{"type":"text","name":"title","content":"Hello"},{"type":"image","name":"logo","url":"https://example.com/logo.png"}].',
      required: true,
    }),
    voice_id: Property.ShortText({
      displayName: 'Voice ID',
      description: 'Optional voice_id from List Voices.',
      required: false,
    }),
    avatar_id: Property.ShortText({
      displayName: 'Avatar ID',
      description: 'Optional numeric avatar id from List Public Avatars or List Custom Avatars.',
      required: false,
    }),
    avatar_type: Property.StaticDropdown({
      displayName: 'Avatar Type',
      description: 'Only used with Avatar ID. Defaults to public.',
      required: false,
      options: {
        options: [
          { label: 'Public (JoggAI library)', value: 'public' },
          { label: 'Custom (your avatar)', value: 'custom' },
        ],
      },
    }),
    captions: Property.StaticDropdown({
      displayName: 'Captions',
      required: false,
      options: { options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
    }),
    video_name: Property.ShortText({
      displayName: 'Video Name',
      required: false,
    }),
  },
  async run(context) {
    const { template_id, voice_language, variables, voice_id, avatar_id, avatar_type, captions, video_name } =
      context.propsValue;
    if (!voice_language.trim()) {
      throw new Error('Voice Language is required.');
    }
    const data = await joggAiClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/create_video_with_template',
      op: 'create template video',
      body: {
        template_id: joggAiClient.toIntegerId({ value: template_id, label: 'Template ID' }),
        voice_language: voice_language.trim(),
        variables: parseVariables({ value: variables }),
        ...(voice_id?.trim() ? { voice_id: voice_id.trim() } : {}),
        ...(avatar_id?.trim()
          ? {
              avatar_id: joggAiClient.toIntegerId({ value: avatar_id, label: 'Avatar ID' }),
              avatar_type: avatar_type === 'custom' ? 1 : 0,
            }
          : {}),
        ...(captions === 'yes' || captions === 'no' ? { captions_enabled: captions === 'yes' } : {}),
        ...(video_name?.trim() ? { video_name: video_name.trim() } : {}),
      },
    });
    return { video_id: data['video_id'] ?? null };
  },
});

function parseVariables({ value }: { value: unknown }): TemplateVariable[] {
  const parsed = typeof value === 'string' ? safeParse({ text: value }) : value;
  const list = Array.isArray(parsed) ? parsed : joggAiClient.isRecord(parsed) ? [parsed] : null;
  if (!list || list.length === 0) {
    throw new Error('Variables must be a non-empty list of {type, name, content or url}.');
  }
  return list.map((item, index) => {
    if (!joggAiClient.isRecord(item)) {
      throw new Error(`Variable ${index + 1} must be an object with type and name.`);
    }
    const type = item['type'];
    const name = item['name'];
    if (typeof type !== 'string' || !VARIABLE_TYPES.includes(type)) {
      throw new Error(`Variable ${index + 1} type must be one of ${VARIABLE_TYPES.join(', ')}.`);
    }
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error(`Variable ${index + 1} needs a name.`);
    }
    const content = item['content'];
    const url = item['url'];
    const properties = type === 'text' || type === 'script'
      ? { content: typeof content === 'string' ? content : '' }
      : { url: typeof url === 'string' ? url : '' };
    if (!Object.values(properties)[0]) {
      throw new Error(
        `Variable "${name}" needs ${type === 'text' || type === 'script' ? 'content' : 'a url'}.`
      );
    }
    return { type, name: name.trim(), properties };
  });
}

function safeParse({ text }: { text: string }): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Variables must be valid JSON.');
  }
}

const VARIABLE_TYPES = ['text', 'image', 'video', 'script'];

type TemplateVariable = {
  type: string;
  name: string;
  properties: { content?: string; url?: string };
};
