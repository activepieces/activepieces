import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sendrApiCall, flattenObject } from '../common';

export const queueVideoGeneration = createAction({
  auth: sendrAuth,
  name: 'queue_video_generation',
  displayName: 'Queue Video Generation',
  description: 'Queues a job to merge audio and video or generate a lipsync video.',
  audience: 'both',
  aiMetadata: { description: 'Queues an async video-generation job in one of two modes: merge an audio track onto a base video, or produce a lipsync video. Requires the mode and audio URL (plus a video/Mux source as the mode needs); results are delivered later (optionally to a callback URL). Not idempotent: each call enqueues a new job.', idempotent: false },
  props: {
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: 'Choose the video generation mode.',
      required: true,
      defaultValue: 'merge',
      options: {
        options: [
          { label: 'Merge Audio + Video', value: 'merge' },
          { label: 'Lipsync', value: 'lipsync' },
        ],
      },
    }),
    audioUrl: Property.ShortText({
      displayName: 'Audio URL',
      description: 'Public URL of the audio track to use.',
      required: true,
    }),
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'Public URL of the base video to use.',
      required: false,
    }),
    muxAssetId: Property.ShortText({
      displayName: 'Mux Asset ID',
      description: 'Optional Mux asset ID for the video source.',
      required: false,
    }),
    targetWord: Property.ShortText({
      displayName: 'Target Word',
      description: 'Optional target word for personalization.',
      required: false,
    }),
    replacementWord: Property.ShortText({
      displayName: 'Replacement Word',
      description: 'Optional replacement word.',
      required: false,
    }),
    pageSlug: Property.ShortText({
      displayName: 'Page Slug',
      description: 'Optional Sendr Page slug to associate with this video.',
      required: false,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'Optional callback URL to receive status updates when the video job is done.',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      audioUrl: context.propsValue.audioUrl,
      mode: context.propsValue.mode,
    };
    if (context.propsValue.videoUrl) {
      body['videoUrl'] = context.propsValue.videoUrl;
    }
    if (context.propsValue.muxAssetId) {
      body['muxAssetId'] = context.propsValue.muxAssetId;
    }
    if (context.propsValue.targetWord) {
      body['targetWord'] = context.propsValue.targetWord;
    }
    if (context.propsValue.replacementWord) {
      body['replacementWord'] = context.propsValue.replacementWord;
    }
    if (context.propsValue.pageSlug) {
      body['pageSlug'] = context.propsValue.pageSlug;
    }
    if (context.propsValue.webhookUrl) {
      body['webhookUrl'] = context.propsValue.webhookUrl;
    }
    const response = await sendrApiCall<Record<string, unknown>>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/enrichment/generate-video',
      body,
    });
    return flattenObject(response.body);
  },
});
