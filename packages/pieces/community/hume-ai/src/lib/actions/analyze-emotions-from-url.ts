import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { Hume, HumeClient } from 'hume';
import { humeAiAuth } from '../common/auth';

export const analyzeEmotionsFromUrl = createAction({
  name: 'analyze_emotions_from_url',
  classification: 'READ',
  displayName: 'Analyze Emotions from URL',
  description: 'Start emotion analysis on images, audio or video at public URLs.',
  audience: 'both',
  aiMetadata: {
    description: 'Start an asynchronous Hume AI Expression Measurement batch job over media (image, video, audio) referenced by URL, returning a job ID; results are fetched later with Get Emotion Results. Use to measure emotional expression in hosted media. Accepts up to 100 URLs or archives, with optional model selection, transcription, callback URL, and email notification. Each call queues a new job, so it is not idempotent.',
    idempotent: false,
  },
  auth: humeAiAuth,
  props: {
    info: Property.MarkDown({
      value: 'Analysis runs in the background. Pass the Job ID this step returns to **Get Emotion Results**.',
      variant: MarkdownVariant.INFO,
    }),
    urls: Property.Array({
      displayName: 'Media URLs',
      description: 'Public links to images, audio, video or .zip archives, up to 100.',
      required: true,
    }),
    models: Property.Object({
      displayName: 'Models',
      description: 'Keys: face, prosody, language, burst, ner, facemesh. Empty: all.',
      required: false,
    }),
    transcription: Property.Checkbox({
      displayName: 'Include Transcription',
      description: 'Transcribe speech in the media as part of the analysis.',
      required: false,
      defaultValue: false,
    }),
    callbackUrl: Property.ShortText({
      displayName: 'Callback URL',
      description: 'Hume sends the results here when the job finishes.',
      placeholder: 'https://example.com/hume-results',
      required: false,
    }),
    notify: Property.Checkbox({
      displayName: 'Email Notification',
      description: 'Hume emails you when the job finishes or fails.',
      required: false,
      defaultValue: true,
    }),
  },
  propertyGroups: [
    { key: 'media', display: 'section', label: 'Media', icon: 'file', props: ['info', 'urls', 'models'] },
    { key: 'options', display: 'section', label: 'Options', icon: 'sliders', props: ['transcription', 'notify', 'callbackUrl'] },
  ],
  async run(context) {
    const client = new HumeClient({
      apiKey: context.auth.secret_text,
    });

    const { urls, models, transcription, callbackUrl, notify } = context.propsValue;

    const modelsConfig = toModels({ models });

    const request: Hume.expressionMeasurement.batch.InferenceBaseRequest = {
      urls: urls.filter((url): url is string => typeof url === 'string'),
      ...(modelsConfig && { models: modelsConfig }),
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

function isPlainObject(value: unknown): value is Record<string, never> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toModelConfig({ value }: { value: unknown }): Record<string, never> {
  if (isPlainObject(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return isPlainObject(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function toModels({ models }: { models: unknown }): Hume.expressionMeasurement.batch.Models | undefined {
  if (!isPlainObject(models)) {
    return undefined;
  }
  const supportedKeys = ['face', 'burst', 'prosody', 'language', 'ner', 'facemesh'];
  const entries = supportedKeys
    .filter((key) => Object.prototype.hasOwnProperty.call(models, key))
    .map((key) => [key, toModelConfig({ value: models[key] })]);
  if (entries.length === 0) {
    return undefined;
  }
  return Object.fromEntries(entries);
}
