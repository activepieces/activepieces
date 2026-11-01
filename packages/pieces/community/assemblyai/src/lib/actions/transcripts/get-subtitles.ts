import { createAction, Property } from '@activepieces/pieces-framework';
import { SubtitleFormat } from 'assemblyai';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { transcriptIdProp } from './shared-props';

export const getSubtitles = createAction({
  name: 'getSubtitles',
  classification: 'READ',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Get Transcript Subtitles',
  description: 'Export the transcript as SRT or VTT subtitles.',
  audience: 'both',
  aiMetadata: {
    description:
      'Exports an existing transcript, identified by its ID, as a subtitle file in either SRT or VTT format (selectable). Use this to produce captions from a completed transcript, optionally capping characters per caption. Requires a valid transcript ID; read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'subtitles',
      display: 'section',
      label: 'Subtitles',
      icon: 'text',
      props: ['id', 'format', 'chars_per_caption'],
    },
  ],
  props: {
    id: transcriptIdProp,
    format: Property.StaticDropdown({
      displayName: 'Format',
      display: 'cards',
      required: true,
      defaultValue: 'srt',
      options: {
        options: [
          {
            label: 'SRT',
            value: 'srt',
            description: 'Most players',
            icon: 'text',
          },
          {
            label: 'VTT',
            value: 'vtt',
            description: 'Web players',
            icon: 'code',
          },
        ],
      },
    }),
    chars_per_caption: Property.Number({
      displayName: 'Max Characters per Caption',
      description: 'Longest caption line in characters.',
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
