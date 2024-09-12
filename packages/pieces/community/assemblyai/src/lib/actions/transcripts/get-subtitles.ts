import { createAction, Property } from '@activepieces/pieces-framework';
import { SubtitleFormat } from 'assemblyai';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';

export const getSubtitles = createAction({
  name: 'getSubtitles',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Get Transcript Subtitles',
  description: 'Export the transcript as SRT or VTT subtitles.',
  props: {
    id: Property.ShortText({
      displayName: 'Transcript ID',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Subtitles Format',
      required: true,
      defaultValue: 'srt',
      options: {
        options: [
          {
            label: 'SRT',
            value: 'srt',
          },
          {
            label: 'VTT',
            value: 'vtt',
          },
        ],
      },
    }),
    chars_per_caption: Property.Number({
      displayName: 'Number of Characters per Caption',
      description: 'The maximum number of characters per caption',
      required: false,
    }),
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const subtitles = await client.transcripts.subtitles(
      context.propsValue.id,
      context.propsValue.format as SubtitleFormat,
      context.propsValue.chars_per_caption
    );
    return subtitles;
  },
});
