import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { vidlab7Auth } from '../common/auth';

export const createVideo = createAction({
  auth: vidlab7Auth,
  name: 'createVideo',
  displayName: 'Create Video',
  description: 'Generate a video using a studio avatar',
  props: {
    avatarId: Property.ShortText({
      displayName: 'Avatar ID',
      description: 'The ID of the avatar to be used for the video generation',
      required: true,
    }),
    script: Property.LongText({
      displayName: 'Script',
      description: 'The script to be used for the video generation',
      required: true,
    }),
    voiceId: Property.ShortText({
      displayName: 'Voice ID',
      description: 'The ID of the voice to be used for the video generation',
      required: true,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description:
        'The URL to which the webhook will be sent when video generation is complete',
      required: true,
    }),
    similarity_boost: Property.Number({
      displayName: 'Similarity Boost',
      description: 'Voice similarity boost setting (0-100)',
      required: false,
      defaultValue: 50,
    }),
    use_speaker_boost: Property.Checkbox({
      displayName: 'Use Speaker Boost',
      description: 'Enable speaker boost for better voice quality',
      required: false,
      defaultValue: true,
    }),
    style: Property.Number({
      displayName: 'Style',
      description: 'Voice style setting',
      required: false,
      defaultValue: 0,
    }),
    stability: Property.Number({
      displayName: 'Stability',
      description: 'Voice stability setting (0-100)',
      required: false,
      defaultValue: 50,
    }),
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description:
        'Wait for the video generation to complete and return the video URL. If disabled, only returns the video ID.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      avatarId,
      script,
      voiceId,
      webhookUrl,
      similarity_boost,
      use_speaker_boost,
      style,
      stability,
      waitForCompletion,
    } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api-prd.vidlab7.com/api/studio-avatar/generate-video',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': context.auth.secret_text,
      },
      body: {
        avatarId,
        script,
        voiceId,
        webhookUrl,
        voice_settings: {
          similarity_boost,
          use_speaker_boost,
          style,
          stability,
        },
      },
    });

    const initialResult = response.body as { id: string; status: string };

    if (!waitForCompletion) {
      return initialResult;
    }

    const videoId = initialResult.id;
    const interval = 5 * 1000;
    const maxWait = 300 * 1000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, interval));

      const statusResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api-prd.vidlab7.com/api/studio-avatar/generated-video/${videoId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': context.auth.secret_text,
        },
      });

      const statusData = statusResponse.body as {
        success: boolean;
        data: { status: string; videoUrl?: string };
      };

      if (statusData.success && statusData.data.status === 'COMPLETED') {
        return statusData.data;
      }

      if (statusData.data.status === 'FAILED') {
        throw new Error('Video generation failed');
      }
    }

    throw new Error(`Video generation timed out after 300 seconds`);
  },
});
