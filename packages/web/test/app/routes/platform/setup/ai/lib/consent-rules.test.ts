import { describe, expect, it } from 'vitest';

import {
  CONSENT_RULE_ROWS,
  consentRules,
} from '@/app/routes/platform/setup/ai/lib/consent-rules';

describe('consentRules.ruleFor', () => {
  it('defaults every kind to ask when nothing is configured', () => {
    for (const row of CONSENT_RULE_ROWS) {
      expect(consentRules.ruleFor({ settings: undefined, kind: row.kind })).toBe(
        'ask',
      );
      expect(consentRules.ruleFor({ settings: {}, kind: row.kind })).toBe('ask');
    }
  });

  it('reads a configured override', () => {
    const settings = { overrides: { financial: 'deny' as const } };
    expect(consentRules.ruleFor({ settings, kind: 'financial' })).toBe('deny');
    expect(consentRules.ruleFor({ settings, kind: 'outward_send' })).toBe('ask');
  });
});

describe('consentRules.applyRule', () => {
  it('adds an override without touching other rules or the full-access field', () => {
    const settings = {
      fullAccessAllowedFor: 'admins_only' as const,
      overrides: { financial: 'deny' as const },
    };
    const next = consentRules.applyRule({
      settings,
      kind: 'outward_send',
      decision: 'allow',
    });
    expect(next).toStrictEqual({
      fullAccessAllowedFor: 'admins_only',
      overrides: { financial: 'deny', outward_send: 'allow' },
    });
  });

  it('choosing ask removes the override instead of storing a redundant rule', () => {
    const settings = {
      overrides: { financial: 'deny' as const, outward_send: 'allow' as const },
    };
    const next = consentRules.applyRule({
      settings,
      kind: 'financial',
      decision: 'ask',
    });
    expect(next).toStrictEqual({ overrides: { outward_send: 'allow' } });
  });

  it('drops the overrides object entirely when the last rule goes back to ask', () => {
    const settings = { overrides: { financial: 'deny' as const } };
    const next = consentRules.applyRule({
      settings,
      kind: 'financial',
      decision: 'ask',
    });
    expect(next).toStrictEqual({});
  });

  it('does not mutate the settings it was given', () => {
    const settings = { overrides: { financial: 'deny' as const } };
    consentRules.applyRule({ settings, kind: 'outward_send', decision: 'deny' });
    expect(settings).toStrictEqual({ overrides: { financial: 'deny' } });
  });
});

describe('consentRules.hasAllowedRule', () => {
  it('flags an allow anywhere and stays quiet otherwise', () => {
    expect(consentRules.hasAllowedRule({ settings: undefined })).toBe(false);
    expect(
      consentRules.hasAllowedRule({
        settings: { overrides: { financial: 'deny' } },
      }),
    ).toBe(false);
    expect(
      consentRules.hasAllowedRule({
        settings: { overrides: { financial: 'deny', external_write: 'allow' } },
      }),
    ).toBe(true);
  });
});

describe('CONSENT_RULE_ROWS', () => {
  it('covers every enforceable kind exactly once', () => {
    const kinds = CONSENT_RULE_ROWS.map((row) => row.kind).sort();
    expect(kinds).toStrictEqual([
      'destructive',
      'external_write',
      'financial',
      'input_dependent',
      'internal_destructive',
      'outward_send',
      'unknown',
    ]);
  });
});
