import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tunovaAuth } from '../common/auth';
import { tunovaRequest } from '../common/client';

export const generateSong = createAction({
  auth: tunovaAuth,
  name: 'generate_song',
  displayName: 'Generate Song',
  description:
    'Submit a song generation job from a text prompt. Async — returns a job_id; use "Get Job" to poll for the finished track. Billed only on a successful render.',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'A text description of the song, e.g. "calm rainy-night lofi".',
      required: true,
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Suno model to use.',
      required: false,
      defaultValue: 'v5.5',
    }),
    makeInstrumental: Property.Checkbox({
      displayName: 'Instrumental',
      description: 'Generate an instrumental (no vocals).',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    return tunovaRequest(context.auth.props.apiKey, HttpMethod.POST, '/api/generate', {
      prompt: context.propsValue.prompt,
      model: context.propsValue.model,
      make_instrumental: context.propsValue.makeInstrumental,
    });
  },
});
