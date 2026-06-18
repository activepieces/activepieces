import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';

export const youtubeDownloadCaptionAction = createAction({
  auth: youtubeAuth,
  name: 'download_caption',
  displayName: 'Download Caption',
  description:
    'Returns a caption track text by caption ID using the YouTube captions.download endpoint. Requires permission to edit the video, so it only works for captions on videos the authenticated user owns. Auto-generated (asr) caption tracks cannot be downloaded and will return a 403.',
  props: {
    captionId: Property.ShortText({
      displayName: 'Caption ID',
      description: 'The caption track ID to download.',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format (tfmt)',
      description: 'Optional output format for the caption track.',
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
      displayName: 'Target Language (tlang)',
      description:
        'Optional language code for machine-translated captions (for example: en, es, fr).',
      required: false,
    }),
    onBehalfOfContentOwner: Property.ShortText({
      displayName: 'On Behalf Of Content Owner',
      description:
        'Optional. Intended for YouTube CMS content partners acting on behalf of a content owner.',
      required: false,
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