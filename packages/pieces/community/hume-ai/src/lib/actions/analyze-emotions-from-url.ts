import { Property, createAction } from '@activepieces/pieces-framework';
import { HumeClient } from 'hume';
import { humeAiAuth } from '../common/auth';

export const analyzeEmotionsFromUrl = createAction({
  name: 'analyze_emotions_from_url',
  displayName: 'Analyze Emotions from URL',
  description: 'Start a batch emotion analysis job for media files hosted at URLs',
  auth: humeAiAuth,
  props: {
    urls: Property.Array({
      displayName: 'Media URLs',
      description: 'URLs to media files to analyze (images, videos, audio). Supports up to 100 URLs or archives (.zip, .tar.gz)',
      required: true,
    }),
    models: Property.Object({
      displayName: 'Models Configuration',
      description: 'Specify which models to use for inference. Leave empty to run all models.',
      required: false,
    }),
    transcription: Property.Checkbox({
      displayName: 'Include Transcription',
      description: 'Include speech-to-text transcription in the analysis',
      required: false,
      defaultValue: false,
    }),
    callbackUrl: Property.ShortText({
      displayName: 'Callback URL',
      description: 'Optional webhook URL to receive results when the job completes',
      required: false,
    }),
    notify: Property.Checkbox({
      displayName: 'Email Notification',
      description: 'Send email notification upon job completion or failure',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const client = new HumeClient({
      apiKey: context.auth.secret_text,
    });

    const { urls, models, transcription, callbackUrl, notify } = context.propsValue;

    const request: any = {
      urls: urls as string[],
      ...(models && { models }),
      ...(transcription && { transcription: {} }),
      ...(callbackUrl && { callbackUrl }),
      ...(notify !== undefined && { notify }),
    };

    try {
      const response = await client.expressionMeasurement.batch.startInferenceJob(request);

      return {
        jobId: response.jobId,
        status: 'processing',
        message: 'Emotion analysis job started successfully. Use "Get Emotion Results" action to retrieve predictions.',
      };
    } catch (error) {
      throw new Error(`Emotion analysis job failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
