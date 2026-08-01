import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { waflyAuth, waflyApiCall } from '../common';

export const setTranscription = createAction({
  auth: waflyAuth,
  name: 'set_transcription',
  displayName: 'Configure Audio Transcription',
  description:
    'Have received voice notes arrive already transcribed in the webhook, using your own OpenAI key.',
  audience: 'both',
  aiMetadata: {
    description:
      'Turns on or updates audio transcription for a Wafly instance, so incoming WhatsApp voice notes arrive with their text transcript in the webhook payload. Uses the customer\'s own OpenAI key, billed directly by OpenAI. This is an instance-level setting, not a per-message step. Idempotent.',
    idempotent: true,
  },
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'OpenAI API Key',
      description:
        'Yours — the cost lands on your own OpenAI account and Wafly adds nothing. Stored encrypted and never returned by the API. Leave empty to keep the key already saved and change only the limits.',
      required: false,
    }),
    maxAudioSeconds: Property.Number({
      displayName: 'Max Audio Length (seconds)',
      description: 'Voice notes longer than this are delivered without a transcript.',
      required: true,
      defaultValue: 300,
    }),
    monthlyMinutesCap: Property.Number({
      displayName: 'Monthly Cap (minutes)',
      description:
        'Once reached, messages still arrive — only without the transcript. Nothing is dropped.',
      required: true,
      defaultValue: 500,
    }),
  },
  async run(context) {
    const { apiKey, maxAudioSeconds, monthlyMinutesCap } = context.propsValue;
    const key = (apiKey ?? '').trim();

    return await waflyApiCall({
      auth: context.auth,
      method: HttpMethod.PUT,
      resourceUri: '/ai-config',
      body: {
        provider: 'openai',
        // Empty key means "keep the stored one", so the cap can be adjusted
        // without pasting the secret into the flow again.
        ...(key ? { api_key: key } : {}),
        transcription: {
          enabled: true,
          max_audio_seconds: maxAudioSeconds,
          monthly_minutes_cap: monthlyMinutesCap,
        },
      },
    });
  },
});
