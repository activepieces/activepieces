import { createAction, Property } from '@activepieces/pieces-framework';
import { getYoutubeTranscriptAuth } from '../auth';
import { getYoutubeTranscriptRequest } from '../common/client';

export const listChannelVideosAction = createAction({
  name: 'list_channel_videos',
  classification: 'READ',
  displayName: 'List Channel Videos',
  description: "Lists a YouTube channel's videos, newest first, one page at a time.",
  audience: 'both',
  aiMetadata: {
    description:
      "Lists the videos of a YouTube channel (by @handle, channel URL, or channel ID), newest first, one page at a time. Pass the previous response's continuation token to get the next page. Useful before fetching transcripts for a whole channel. Read-only and idempotent.",
    idempotent: true,
  },
  auth: getYoutubeTranscriptAuth,
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description: 'Channel @handle, channel URL, or channel ID (UC...).',
      required: true,
    }),
    continuation: Property.ShortText({
      displayName: 'Continuation Token',
      description: 'The continuation token from a previous page, to get the next page.',
      required: false,
    }),
  },
  async run(context) {
    const { channel, continuation } = context.propsValue;
    return getYoutubeTranscriptRequest(context.auth.secret_text, '/channel/videos', {
      // The API takes either a channel (first page) or a continuation token (later pages).
      channel: continuation ? undefined : channel,
      continuation: continuation ?? undefined,
    });
  },
});
