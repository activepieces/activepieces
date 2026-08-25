import { createTrigger, TriggerStrategy, PiecePropValueSchema, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { HumeClient } from 'hume';
import { humeAiAuth } from '../common/auth';

const polling: Polling<AppConnectionValueForAuthProperty<typeof humeAiAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const client = new HumeClient({
      apiKey: auth.secret_text,
    });

    const allVoices: any[] = [];
    const pageableResponse = await client.tts.voices.list({
      provider: "CUSTOM_VOICE"
    });

    for await (const voice of pageableResponse) {
      allVoices.push(voice);
    }

    const newVoices = lastFetchEpochMS
      ? allVoices.filter(voice => {
          return true;
        })
      : allVoices;

    const items = newVoices.map((voice: any) => ({
      epochMilliSeconds: Date.now(),
      data: {
        id: voice.id,
        name: voice.name,
        provider: voice.provider,
        compatibleOctaveModels: voice.compatibleOctaveModels,
      },
    }));

    return items;
  },
};

export const newVoiceTrigger = createTrigger({
  auth: humeAiAuth,
  name: 'new_voice',
  displayName: 'New Voice',
  description: 'Triggers when a new voice is created in Hume AI',
  aiMetadata: {
    description: 'Fires when a new custom voice appears in the connected Hume AI account, polling the custom voice list on an interval. Each emitted event represents one newly detected custom voice.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'voice_123',
    name: 'My Custom Voice',
    provider: 'CUSTOM_VOICE',
    compatibleOctaveModels: ['octave-2'],
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
