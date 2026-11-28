import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { sprinklr } from '../src/index';
import { sprinklrAuth } from '../src/lib/auth';

const MAX_PROPERTY_DESCRIPTION = 70;
const CLASSIFICATIONS = ['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE'];
const CUSTOM_API_CALL = 'custom_api_call';

function isOneSentence(text: string | undefined): boolean {
  if (typeof text !== 'string') {
    return false;
  }
  const trimmed = text.trim();
  return trimmed.length > 0 && /[.!?]$/.test(trimmed) && !/[.!?]\s+\S/.test(trimmed) && !trimmed.includes('\n');
}

function longDescriptions({ owner, props }: { owner: string; props: Record<string, unknown> }): string[] {
  return Object.entries(props).flatMap(([key, prop]) => {
    if (typeof prop !== 'object' || prop === null) {
      return [];
    }
    const description = 'description' in prop && typeof prop.description === 'string' ? prop.description : '';
    const own = description.length > MAX_PROPERTY_DESCRIPTION ? [`${owner}.${key} (${description.length}): ${description}`] : [];
    const nested =
      'properties' in prop && typeof prop.properties === 'object' && prop.properties !== null
        ? longDescriptions({ owner: `${owner}.${key}`, props: { ...prop.properties } })
        : [];
    return [...own, ...nested];
  });
}

describe('sprinklr piece', () => {
  const actions = Object.values(sprinklr.actions());
  const handWritten = actions.filter((action) => action.name !== CUSTOM_API_CALL);
  const triggers = Object.values(sprinklr.triggers());

  it('has the planned metadata', () => {
    expect(sprinklr.displayName).toBe('Sprinklr');
    expect(sprinklr.minimumSupportedRelease).toBe('0.88.2');
    expect(sprinklr.categories).toEqual(['CUSTOMER_SUPPORT', 'SALES_AND_CRM']);
    expect(sprinklr.logoUrl).toBe('https://cdn.activepieces.com/pieces/sprinklr.png');
    expect(sprinklr.auth).toBe(sprinklrAuth);
  });

  it('ships Custom API Call for humans', () => {
    const custom = actions.find((action) => action.name === CUSTOM_API_CALL);
    expect(custom).toBeDefined();
    expect(custom?.audience).toBe('human');
  });

  it('gives every hand-written action an audience, aiMetadata, a classification and an output schema', () => {
    const offenders = handWritten.flatMap((action) => {
      const problems = [
        ['audience', ['human', 'ai', 'both'].includes(String(action.audience))],
        ['aiMetadata.description', typeof action.aiMetadata?.description === 'string' && action.aiMetadata.description.trim().length > 0],
        ['aiMetadata.idempotent', typeof action.aiMetadata?.idempotent === 'boolean'],
        ['classification', CLASSIFICATIONS.includes(String(action.classification))],
        ['outputSchema', action.outputSchema !== undefined],
      ];
      return problems.filter(([, passed]) => !passed).map(([field]) => `${action.name}: ${field}`);
    });
    expect(offenders).toEqual([]);
  });

  it('gives every trigger aiMetadata, a READ classification and an output schema', () => {
    const offenders = triggers.flatMap((trigger) => {
      const problems = [
        ['aiMetadata.description', typeof trigger.aiMetadata?.description === 'string' && trigger.aiMetadata.description.trim().length > 0],
        ['classification', trigger.classification === 'READ'],
        ['outputSchema', trigger.outputSchema !== undefined],
      ];
      return problems.filter(([, passed]) => !passed).map(([field]) => `${trigger.name}: ${field}`);
    });
    expect(offenders).toEqual([]);
  });

  it('writes every hand-written action description as one sentence', () => {
    const offenders = handWritten.filter((action) => !isOneSentence(action.description)).map((action) => `${action.name}: ${action.description}`);
    expect(offenders).toEqual([]);
  });

  it('keeps every property description at 70 characters or fewer', () => {
    const offenders = [
      ...handWritten.flatMap((action) => longDescriptions({ owner: action.name, props: action.props })),
      ...triggers.flatMap((trigger) => longDescriptions({ owner: trigger.name, props: trigger.props })),
      ...longDescriptions({ owner: 'auth', props: { ...sprinklrAuth.props } }),
    ];
    expect(offenders).toEqual([]);
  });

  it('gives every action and trigger a unique name', () => {
    const names = [...actions.map((action) => action.name), ...triggers.map((trigger) => trigger.name)];
    expect(new Set(names).size).toBe(names.length);
  });

  it('ships no translation file', () => {
    expect(existsSync(path.resolve(__dirname, '../src/i18n/translation.json'))).toBe(false);
  });

  it('flags a two-sentence description and a long property description', () => {
    expect(isOneSentence('Gets one case by its case number or ID.')).toBe(true);
    expect(isOneSentence('Gets a case. Then more.')).toBe(false);
    expect(isOneSentence('No full stop')).toBe(false);
    expect(longDescriptions({ owner: 'x', props: { a: { description: 'y'.repeat(71) } } })).toHaveLength(1);
    expect(longDescriptions({ owner: 'x', props: { a: { description: 'y'.repeat(70) } } })).toEqual([]);
    expect(longDescriptions({ owner: 'x', props: { a: { properties: { b: { description: 'y'.repeat(80) } } } } })).toHaveLength(1);
  });
});
