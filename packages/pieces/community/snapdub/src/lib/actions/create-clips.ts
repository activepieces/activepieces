import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { snapdubAuth } from '../auth';
import { snapdubClient, SnapDubVideo } from '../common/client';
import { snapdubProps, TRANSLATE_LANGUAGES } from '../common/props';

export const createClipsAction = createAction({
  auth: snapdubAuth,
  name: 'create_clips',
  classification: 'WRITE',
  displayName: 'Create Clips',
  description:
    'Turns a long video link into short vertical clips with captions. Spends credits from your SnapDub plan.',
  audience: 'both',
  aiMetadata: {
    description:
      'Start making short vertical clips with captions from a long video link (YouTube, Twitch, Kick, Rumble or Zoom). Returns at once with a video_id while processing takes minutes; use the Clips Ready trigger or List Clips to read the results. Each call creates a new video and spends credits, so retries duplicate the work.',
    idempotent: false,
  },
  props: {
    url: Property.ShortText({
      displayName: 'Video URL',
      description:
        "Link to the long video on YouTube, Twitch, Kick, Rumble or Zoom, e.g. 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'.",
      required: true,
    }),
    template: snapdubProps.templateDropdown,
    clips: Property.Number({
      displayName: 'Number of Clips',
      description:
        'How many clips to make, from 1 to 20. Leave empty for the template value, or 6.',
      required: false,
    }),
    clip_length_seconds: Property.Number({
      displayName: 'Longest Clip (Seconds)',
      description:
        'The longest a clip may run, from 15 to 180 seconds. Leave empty for the template value, or 180.',
      required: false,
    }),
    captions: Property.StaticDropdown({
      displayName: 'Captions',
      description:
        'Burn captions into the clips. Leave empty for the template value, or on.',
      required: false,
      options: {
        options: [
          { label: 'On', value: 'on' },
          { label: 'Off', value: 'off' },
        ],
      },
    }),
    translate_to: Property.StaticDropdown({
      displayName: 'Translate Captions To',
      description:
        'Translate the captions into another language. Leave empty to keep the original language.',
      required: false,
      options: {
        options: TRANSLATE_LANGUAGES,
      },
    }),
  },
  async run(context) {
    const {
      url,
      template,
      clips,
      clip_length_seconds,
      captions,
      translate_to,
    } = context.propsValue;
    return await snapdubClient.call<SnapDubVideo>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/videos',
      body: snapdubClient.compact({
        values: {
          url: url.trim(),
          template,
          clips,
          clip_length_seconds,
          captions: captions ? captions === 'on' : undefined,
          translate_to,
        },
      }),
    });
  },
});
