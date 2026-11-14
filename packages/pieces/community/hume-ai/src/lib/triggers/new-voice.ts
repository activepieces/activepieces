import { createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { HumeClient, Hume } from 'hume';
import { humeAiAuth } from '../common/auth';

const KNOWN_VOICE_IDS_KEY = 'known_voice_ids';

export const newVoiceTrigger = createTrigger({
  auth: humeAiAuth,
  name: 'new_voice',
  classification: 'READ',
  displayName: 'New Voice',
  description: 'Fires when a custom voice is saved to your Hume account.',
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
    const existing = await context.store.get<string[]>(KNOWN_VOICE_IDS_KEY);
    if (context.isRepublish && existing !== null && existing !== undefined) {
      return;
    }
    const voices = await listCustomVoices({ auth: context.auth });
    await context.store.put(KNOWN_VOICE_IDS_KEY, voices.map((voice) => voice.id));
  },
  async onDisable(context) {
    await context.store.delete(KNOWN_VOICE_IDS_KEY);
  },
  async test(context) {
    const voices = await listCustomVoices({ auth: context.auth });
    return voices.slice(0, 5).map(toEmittedVoice);
  },
  async run(context) {
    const voices = await listCustomVoices({ auth: context.auth });
    const currentIds = voices.map((voice) => voice.id);
    const known = await context.store.get<string[]>(KNOWN_VOICE_IDS_KEY);
    await context.store.put(KNOWN_VOICE_IDS_KEY, currentIds);
    if (known === null || known === undefined) {
      return [];
    }
    const knownIds = new Set(known);
    return voices.filter((voice) => !knownIds.has(voice.id)).map(toEmittedVoice);
  },
});

async function listCustomVoices({ auth }: { auth: AppConnectionValueForAuthProperty<typeof humeAiAuth> }): Promise<Hume.tts.ReturnVoice[]> {
  const client = new HumeClient({
    apiKey: auth.secret_text,
  });
  const pageableResponse = await client.tts.voices.list({
    provider: 'CUSTOM_VOICE',
  });
  const voices: Hume.tts.ReturnVoice[] = [];
  for await (const voice of pageableResponse) {
    voices.push(voice);
  }
  return voices;
}

function toEmittedVoice(voice: Hume.tts.ReturnVoice) {
  return {
    id: voice.id,
    name: voice.name,
    provider: voice.provider,
    compatibleOctaveModels: voice.compatibleOctaveModels,
  };
}
