import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { listCaptionsOutputSchema } from '../output-schemas';

export const youtubeListCaptionsAction = createAction({
  auth: youtubeAuth,

  outputSchema: listCaptionsOutputSchema,
  name: 'list_captions',
  classification: 'SEARCH',
  displayName: 'List Captions',
  description:
    "List a video's caption tracks, with the IDs Download Caption needs.",
  audience: 'human',
  aiMetadata: { description: 'Lists the caption tracks attached to a single YouTube video, covering every track on that video or only the ones named by a comma-separated list of caption IDs. Use it to discover which languages a video is captioned in and to obtain the caption ID that the Download Caption action requires. The video ID is mandatory. Read-only and idempotent.', idempotent: true },
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description: "The v= value in the video's URL.",
      placeholder: 'dQw4w9WgXcQ',
      required: true,
    }),
    captionIds: Property.ShortText({
      displayName: 'Caption IDs',
      description:
        'Only return these tracks. Separate caption IDs with commas.',
      required: false,
      advanced: true,
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
    const { captionIds, onBehalfOfContentOwner, videoId } = context.propsValue;

    const accessToken = context.auth.access_token;

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
