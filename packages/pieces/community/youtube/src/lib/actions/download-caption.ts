import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';

export const youtubeDownloadCaptionAction = createAction({
  auth: youtubeAuth,
  name: 'download_caption',
  classification: 'READ',
  displayName: 'Download Caption',
  description:
    "Download a caption track's text. Works only on videos you own.",
  audience: 'human',
  aiMetadata: { description: 'Downloads the raw text of one YouTube caption track identified by its caption ID, optionally emitting it as SRT, VTT, SBV, SCC, or TTML and machine-translating it into a target language code. Use it after List Captions has supplied the caption ID; the endpoint only serves tracks on videos the authenticated account can edit, and auto-generated (asr) tracks are refused with a 403. Read-only and idempotent.', idempotent: true },
  props: {
    captionId: Property.ShortText({
      displayName: 'Caption ID',
      description: "From List Captions. Auto-generated tracks can't be downloaded.",
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description:
        "File format of the captions. Empty: the track's original format.",
      required: false,
      options: {
        options: [
          { label: 'SRT', value: 'srt' },
          { label: 'VTT', value: 'vtt' },
          { label: 'SBV', value: 'sbv' },
          { label: 'SCC', value: 'scc' },
          { label: 'TTML', value: 'ttml' },
        ],
      },
    }),
    targetLanguage: Property.ShortText({
      displayName: 'Target Language',
      description: 'Translate the captions into this language code.',
      placeholder: 'es',
      required: false,
    }),
    onBehalfOfContentOwner: Property.ShortText({
      displayName: 'On Behalf Of Content Owner',
      description:
        'Content owner ID, for YouTube partners who manage many channels.',
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    const { captionId, format, targetLanguage, onBehalfOfContentOwner } =
      context.propsValue;

    const accessToken = context.auth.access_token;

    const queryParams: Record<string, string> = {
      alt: 'media',
    };

    if (format) queryParams['tfmt'] = format;
    if (targetLanguage) queryParams['tlang'] = targetLanguage;
    if (onBehalfOfContentOwner) {
      queryParams['onBehalfOfContentOwner'] = onBehalfOfContentOwner;
    }

    const response = await httpClient.sendRequest<string>({
      method: HttpMethod.GET,
      url: `https://www.googleapis.com/youtube/v3/captions/${encodeURIComponent(captionId)}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      queryParams,
      responseType: 'text',
    });

    return response.body;
  },
});