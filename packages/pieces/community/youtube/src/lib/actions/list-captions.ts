import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { youtubeAuth } from '../../';

export const youtubeListCaptionsAction = createAction({
  auth: youtubeAuth,
  name: 'list_captions',
  displayName: 'List Captions',
  description:
    'Returns caption tracks for a specific YouTube video using the captions.list endpoint.',
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description: 'The YouTube video ID to list caption tracks for.',
      required: true,
    }),
    captionIds: Property.ShortText({
      displayName: 'Caption IDs',
      description:
        'Optional comma-separated caption track IDs to retrieve (for example: id1,id2).',
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
    const {
      captionIds,
      onBehalfOfContentOwner,
      videoId,
    } = context.propsValue;

    const accessToken = (context.auth as OAuth2PropertyValue).access_token;

    const queryParams: Record<string, string> = {
      part: 'id,snippet',
      videoId,
    };

    if (captionIds) queryParams['id'] = captionIds;
    if (onBehalfOfContentOwner) {
      queryParams['onBehalfOfContentOwner'] = onBehalfOfContentOwner;
    }

    const response = await httpClient.sendRequest<YoutubeCaptionListResponse>({
      method: HttpMethod.GET,
      url: 'https://www.googleapis.com/youtube/v3/captions',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      queryParams,
    });

    return response.body;
  },
});

type YoutubeCaptionListResponse = {
  kind: string;
  etag: string;
  items: YoutubeCaptionResource[];
};

type YoutubeCaptionResource = {
  kind: string;
  etag: string;
  id: string;
  snippet?: {
    videoId?: string;
    language?: string;
    name?: string;
    trackKind?: string;
    isCC?: boolean;
    isLarge?: boolean;
    isEasyReader?: boolean;
    isDraft?: boolean;
    isAutoSynced?: boolean;
    status?: string;
    failureReason?: string;
    audioTrackType?: string;
    lastUpdated?: string;
  };
};