import { ConsentEffectPreview, ConsentPreview } from '@activepieces/shared';

const DISPLAY_RANK: Record<string, number> = {
  read: 0,
  internal_write: 1,
  external_write: 2,
  outward_send: 3,
  input_dependent: 4,
  unknown: 5,
  financial: 6,
  internal_destructive: 7,
  destructive: 8,
};

const IRREVERSIBLE_KINDS = ['destructive', 'internal_destructive'];
const UNPREDICTABLE_KINDS = ['input_dependent', 'unknown'];

const FIRST_STRONG_ISOLATE = '⁨';
const POP_DIRECTIONAL_ISOLATE = '⁩';

function rankOf(kind: string): number {
  return DISPLAY_RANK[kind] ?? DISPLAY_RANK.unknown;
}

function orderedEffects({
  effects,
}: {
  effects: ConsentEffectPreview[];
}): ConsentEffectPreview[] {
  return [...effects].sort((a, b) => rankOf(b.kind) - rankOf(a.kind));
}

function hasKindIn({
  effects,
  kinds,
}: {
  effects: ConsentEffectPreview[];
  kinds: string[];
}): boolean {
  return effects.some((effect) => kinds.includes(effect.kind));
}

function consentTone({ consent }: { consent: ConsentPreview }): ConsentTone {
  if (hasKindIn({ effects: consent.effects, kinds: IRREVERSIBLE_KINDS })) {
    return 'destructive';
  }
  if (consent.severity === 'destructive') {
    return 'destructive';
  }
  if (hasKindIn({ effects: consent.effects, kinds: ['financial'] })) {
    return 'financial';
  }
  if (consent.severity === 'financial') {
    return 'financial';
  }
  if (
    !consent.resolved ||
    hasKindIn({ effects: consent.effects, kinds: UNPREDICTABLE_KINDS })
  ) {
    return 'unknown';
  }
  return 'external';
}

function consentWarnings({
  consent,
}: {
  consent: ConsentPreview;
}): ConsentWarning[] {
  const warnings: ConsentWarning[] = [];
  if (hasKindIn({ effects: consent.effects, kinds: IRREVERSIBLE_KINDS })) {
    warnings.push('irreversible');
  }
  if (hasKindIn({ effects: consent.effects, kinds: ['financial'] })) {
    warnings.push('money');
  }
  if (
    hasKindIn({ effects: consent.effects, kinds: UNPREDICTABLE_KINDS }) ||
    !consent.resolved
  ) {
    warnings.push('unpredictable');
  }
  if (consent.category === 'publish' || consent.category === 'enable') {
    warnings.push('unattended');
  }
  return warnings;
}

function isolateValue(value: string): string {
  return `${FIRST_STRONG_ISOLATE}${value}${POP_DIRECTIONAL_ISOLATE}`;
}

export const consentPresentation = {
  orderedEffects,
  tone: consentTone,
  warnings: consentWarnings,
  isolate: isolateValue,
  rankOf,
};

export type ConsentTone = 'destructive' | 'financial' | 'unknown' | 'external';
export type ConsentWarning =
  | 'irreversible'
  | 'money'
  | 'unpredictable'
  | 'unattended';
