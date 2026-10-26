import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { transkriptorAuth } from '../auth';
import { BASE_URL } from '../common';

export const exportTranscriptAction = createAction({
  auth: transkriptorAuth,
  name: 'export_transcript',
  classification: 'READ',
  displayName: 'Export Transcript',
  description:
    'Exports a transcription in a specific format (TXT, SRT, PDF, DOCX, or JSON).',
  audience: 'both',
  aiMetadata: {
    description:
      'Exports a finished transcription in the chosen format. Returns the content and a presigned download URL. Fails with 202 if the transcription is still processing. Idempotent.',
    idempotent: true,
  },
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order ID of the transcription to export.',
      required: true,
    }),
    exportType: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'Format of the exported transcript.',
      required: true,
      defaultValue: 'txt',
      options: {
        disabled: false,
        options: [
          { label: 'Plain text (TXT)', value: 'txt' },
          { label: 'Subtitles (SRT)', value: 'srt' },
          { label: 'PDF', value: 'pdf' },
          { label: 'Word (DOCX)', value: 'docx' },
          { label: 'JSON', value: 'json' },
        ],
      },
    }),
    includeSpeakerNames: Property.Checkbox({
      displayName: 'Include Speaker Names',
      required: false,
      defaultValue: true,
    }),
    includeTimestamps: Property.Checkbox({
      displayName: 'Include Timestamps',
      required: false,
      defaultValue: true,
    }),
    mergeSameSpeakerSegments: Property.Checkbox({
      displayName: 'Merge Same Speaker Segments',
      required: false,
      defaultValue: false,
    }),
    isSingleParagraph: Property.Checkbox({
      displayName: 'Single Paragraph',
      required: false,
      defaultValue: false,
    }),
    paragraphSize: Property.StaticDropdown({
      displayName: 'Sentences per Paragraph',
      required: false,
      defaultValue: 1,
      options: {
        disabled: false,
        options: [
          { label: '1', value: 1 },
          { label: '2', value: 2 },
          { label: '4', value: 4 },
          { label: '8', value: 8 },
        ],
      },
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      url: `${BASE_URL}/files/${context.propsValue.orderId}/content/export`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      body: {
        export_type: context.propsValue.exportType,
        include_speaker_names: context.propsValue.includeSpeakerNames,
        include_timestamps: context.propsValue.includeTimestamps,
        merge_same_speaker_segments:
          context.propsValue.mergeSameSpeakerSegments,
        is_single_paragraph: context.propsValue.isSingleParagraph,
        paragraph_size: context.propsValue.paragraphSize,
      },
    });

    return response.body;
  },
});
