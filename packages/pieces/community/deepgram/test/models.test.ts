import { afterEach, describe, expect, test, vi } from 'vitest';
import { deepgramModels } from '../src/common/models';
import { listModelsAction } from '../src/actions/list-models';
import { runAction, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const stt = [
  {
    name: 'general',
    canonical_name: 'nova-2-general',
    architecture: 'nova-2',
    languages: ['en'],
    version: '2024-01-09.1',
    batch: true,
    streaming: false,
  },
  {
    name: 'general',
    canonical_name: 'nova-2-general',
    architecture: 'nova-2',
    languages: ['es'],
    version: '2024-02-01.1',
    batch: false,
    streaming: true,
  },
  {
    name: 'general',
    canonical_name: 'nova-3-general',
    architecture: 'nova-3',
    languages: ['en', 'multi'],
    version: '2025-07-31.0',
    batch: true,
    streaming: true,
  },
  {
    name: 'phoneme',
    canonical_name: 'phoneme',
    architecture: 'base',
    languages: ['en'],
    version: '1',
    batch: true,
    streaming: false,
  },
  {
    name: 'general',
    canonical_name: 'general-dQw4w9WgXcQ',
    architecture: 'base',
    languages: ['en'],
    version: '1',
    batch: true,
    streaming: false,
  },
  {
    name: 'streamonly',
    canonical_name: 'flux-general-en',
    architecture: 'flux',
    languages: ['en'],
    version: '1',
    batch: false,
    streaming: true,
  },
  {
    name: 'general',
    canonical_name: 'base-general',
    architecture: 'base',
    languages: ['en'],
    version: '1',
    batch: true,
    streaming: true,
  },
];

const tts = [
  {
    name: 'asteria',
    canonical_name: 'aura-asteria-en',
    architecture: 'aura',
    languages: ['en', 'en-US'],
    version: '1',
    metadata: { accent: 'American', display_name: null, tags: ['feminine'] },
  },
  {
    name: 'thalia',
    canonical_name: 'aura-2-thalia-en',
    architecture: 'aura-2',
    languages: ['en', 'en-US'],
    version: '1',
    metadata: {
      accent: 'American',
      display_name: 'Thalia',
      tags: ['feminine', 'clear'],
      sample: 'https://s.test/t.wav',
      age: 'Adult',
    },
  },
  {
    name: 'celeste',
    canonical_name: 'aura-2-celeste-es',
    architecture: 'aura-2',
    languages: ['es', 'es-CO'],
    version: '1',
    metadata: {
      accent: 'Colombian',
      display_name: 'Celeste',
      tags: ['feminine'],
    },
  },
];

describe('model dropdowns', () => {
  test('dedupe speech models, drop junk and streaming-only entries, nova-3 first', () => {
    const options = deepgramModels.toSttOptions({ models: stt });
    expect(options).toEqual([
      { label: 'nova-3-general (nova-3)', value: 'nova-3-general' },
      { label: 'nova-2-general (nova-2)', value: 'nova-2-general' },
      { label: 'base-general (base)', value: 'base-general' },
    ]);
  });

  test('labels voices with name, family, language and gender, Aura-2 first', () => {
    const options = deepgramModels.toTtsOptions({ models: tts });
    expect(options.map((option) => option.value)).toEqual([
      'aura-2-celeste-es',
      'aura-2-thalia-en',
      'aura-asteria-en',
    ]);
    expect(options[1].label).toBe(
      'Thalia - Aura-2, en (American), feminine [aura-2-thalia-en]'
    );
    expect(options[2].label).toBe(
      'Asteria - Aura, en (American), feminine [aura-asteria-en]'
    );
  });
});

describe('list_models', () => {
  test('returns one flat row per model with merged languages and a language filter', async () => {
    const seen = stubFetch(() => ({ body: { stt, tts } }));
    const result = await runAction({
      action: listModelsAction,
      propsValue: { type: 'all', language: 'es', includeOutdated: true },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/models?include_outdated=true'
    );
    expect(result).toEqual({
      count: 2,
      models: [
        expect.objectContaining({
          canonical_name: 'nova-2-general',
          type: 'stt',
          languages: 'en, es',
          batch: true,
          streaming: true,
          version: '2024-02-01.1',
        }),
        expect.objectContaining({
          canonical_name: 'aura-2-celeste-es',
          type: 'tts',
          name: 'Celeste',
          gender: 'feminine',
          batch: null,
        }),
      ],
    });
  });

  test('uses the project catalog when a project is chosen', async () => {
    const seen = stubFetch(() => ({ body: { stt: [], tts } }));
    const result = await runAction({
      action: listModelsAction,
      propsValue: { type: 'tts', project: 'p 1' },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/projects/p%201/models'
    );
    expect(Reflect.get(Object(result), 'count')).toBe(3);
  });

  test('rejects an unknown type', async () => {
    stubFetch(() => ({ body: {} }));
    await expect(
      runAction({ action: listModelsAction, propsValue: { type: 'video' } })
    ).rejects.toThrow('Type must be all, stt or tts.');
  });
});
