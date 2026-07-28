import { ConsentEffectPreview, ConsentPreview } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { consentPresentation } from '@/app/routes/chat-with-ai/lib/consent-presentation';

function effect(kind: string, displayName = kind): ConsentEffectPreview {
  return {
    displayName,
    detail: `piece · ${kind}`,
    kind,
    recipientResolved: false,
  };
}

function consent(partial: Partial<ConsentPreview>): ConsentPreview {
  return {
    category: 'live_test',
    severity: 'external',
    effects: [],
    resolved: true,
    reusable: false,
    ...partial,
  };
}

describe('consentPresentation.tone', () => {
  it('treats a bundled workspace deletion as destructive even when the card claims financial', () => {
    const preview = consent({
      severity: 'financial',
      effects: [effect('financial'), effect('internal_destructive')],
    });
    expect(consentPresentation.tone({ consent: preview })).toBe('destructive');
  });

  it('reports financial when money moves and nothing is deleted', () => {
    const preview = consent({
      severity: 'financial',
      effects: [effect('financial'), effect('outward_send')],
    });
    expect(consentPresentation.tone({ consent: preview })).toBe('financial');
  });

  it('flags publishing as unattended, because nobody is asked again afterwards', () => {
    const preview = consent({
      category: 'publish',
      effects: [effect('outward_send')],
    });
    expect(consentPresentation.tone({ consent: preview })).toBe('unattended');
  });

  it('still reports destructive for a publish whose flow deletes data', () => {
    const preview = consent({
      category: 'publish',
      effects: [effect('outward_send'), effect('internal_destructive')],
    });
    expect(consentPresentation.tone({ consent: preview })).toBe('destructive');
  });

  it('reports unknown when an effect cannot be predicted', () => {
    const preview = consent({ effects: [effect('input_dependent')] });
    expect(consentPresentation.tone({ consent: preview })).toBe('unknown');
  });

  it('reports unknown when the preview never resolved', () => {
    const preview = consent({ resolved: false, effects: [] });
    expect(consentPresentation.tone({ consent: preview })).toBe('unknown');
  });

  it('reports external for ordinary outside effects', () => {
    const preview = consent({
      effects: [effect('outward_send'), effect('external_write')],
    });
    expect(consentPresentation.tone({ consent: preview })).toBe('external');
  });

  it('honours a destructive severity even with no effect rows', () => {
    const preview = consent({ severity: 'destructive', effects: [] });
    expect(consentPresentation.tone({ consent: preview })).toBe('destructive');
  });
});

describe('consentPresentation.warnings', () => {
  it('names every applicable consequence rather than only the dominant one', () => {
    const preview = consent({
      severity: 'financial',
      effects: [
        effect('financial'),
        effect('internal_destructive'),
        effect('input_dependent'),
      ],
    });
    expect(consentPresentation.warnings({ consent: preview })).toEqual([
      'irreversible',
      'money',
      'unpredictable',
    ]);
  });

  it('warns that a published automation keeps running unattended', () => {
    const preview = consent({
      category: 'publish',
      effects: [effect('outward_send')],
    });
    expect(consentPresentation.warnings({ consent: preview })).toEqual([
      'unattended',
    ]);
  });

  it('stays silent for ordinary external effects', () => {
    const preview = consent({ effects: [effect('external_write')] });
    expect(consentPresentation.warnings({ consent: preview })).toEqual([]);
  });
});

describe('consentPresentation.orderedEffects', () => {
  it('puts irreversible and money effects above sends and writes', () => {
    const preview = [
      effect('external_write'),
      effect('outward_send'),
      effect('financial'),
      effect('internal_destructive'),
      effect('input_dependent'),
    ];
    expect(
      consentPresentation
        .orderedEffects({ effects: preview })
        .map((e) => e.kind),
    ).toEqual([
      'internal_destructive',
      'financial',
      'input_dependent',
      'outward_send',
      'external_write',
    ]);
  });

  it('does not mutate the incoming array', () => {
    const effects = [effect('external_write'), effect('destructive')];
    consentPresentation.orderedEffects({ effects });
    expect(effects.map((e) => e.kind)).toEqual([
      'external_write',
      'destructive',
    ]);
  });

  it('ranks an unrecognised kind as unknown rather than dropping it', () => {
    expect(consentPresentation.rankOf('something_new')).toBe(
      consentPresentation.rankOf('unknown'),
    );
  });
});

describe('consentPresentation.isolate', () => {
  it('wraps interpolated names so right-to-left sentences keep their punctuation', () => {
    const wrapped = consentPresentation.isolate('Refund Failed Orders');
    expect(wrapped.codePointAt(0)).toBe(0x2068);
    expect(wrapped.codePointAt(wrapped.length - 1)).toBe(0x2069);
    expect(wrapped).toContain('Refund Failed Orders');
  });
});
