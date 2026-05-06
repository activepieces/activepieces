import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { youtubeAuth } from '../../';

export const youtubeDownloadCaptionAction = createAction({
  auth: youtubeAuth,
  name: 'download_caption',
  displayName: 'Download Caption',
  description:
    'Downloads a caption track by caption ID using the YouTube captions.download endpoint.',
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

    const accessToken = (context.auth as OAuth2PropertyValue).access_token;

    const queryParams: Record<string, string> = {
      alt: 'media',
    };

    if (format) queryParams['tfmt'] = format;
    if (targetLanguage) queryParams['tlang'] = targetLanguage;
    if (onBehalfOfContentOwner) {
      queryParams['onBehalfOfContentOwner'] = onBehalfOfContentOwner;
    }

    const response = await httpClient.sendRequest<ArrayBuffer>({
      method: HttpMethod.GET,
      url: `https://www.googleapis.com/youtube/v3/captions/${encodeURIComponent(captionId)}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      queryParams,
      responseType: 'arraybuffer',
    });

    return await context.files.write({
      fileName: `youtube-caption-${captionId}.${format ?? 'txt'}`,
      data: Buffer.from(response.body),
    });
  },
});