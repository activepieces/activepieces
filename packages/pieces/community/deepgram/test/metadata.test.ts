import { describe, expect, test } from 'vitest';
import { deepgramPiece } from '../src/index';

const actions = Object.values(deepgramPiece.actions());
const handWritten = actions.filter(
  (action) => action.name !== 'custom_api_call'
);

describe('piece metadata', () => {
  test('every hand-written action declares audience, aiMetadata and classification', () => {
    for (const action of handWritten) {
      expect(['human', 'ai', 'both'], action.name).toContain(action.audience);
      expect(
        action.aiMetadata?.description?.length ?? 0,
        action.name
      ).toBeGreaterThan(40);
      expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
      expect(['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE'], action.name).toContain(
        action.classification
      );
    }
  });

  test('every action except the polymorphic Create Summary has an output schema', () => {
    const missing = handWritten
      .filter((action) => !action.outputSchema)
      .map((action) => action.name);
    expect(missing).toEqual(['create_summary']);
  });

  test('replaced actions are human-only and their agent twins exist', () => {
    const byName = new Map(handWritten.map((action) => [action.name, action]));
    expect(byName.get('create_summary')?.audience).toBe('human');
    expect(byName.get('create_transcription_callback')?.audience).toBe('human');
    expect(byName.get('text_to_speech')?.audience).toBe('human');
    for (const name of [
      'transcribe_audio',
      'list_models',
      'list_requests',
      'get_request',
      'get_usage',
      'get_balances',
      'get_billing_breakdown',
      'list_project_members',
    ]) {
      expect(byName.get(name)?.audience, name).toBe('human');
    }
    for (const name of [
      'list_projects',
      'analyze_text',
      'get_project',
      'update_project',
      'list_project_keys',
    ]) {
      expect(byName.get(name)?.audience, name).toBe('both');
    }
    expect(byName.get('deepgram_generate_speech')?.audience).toBe('ai');
    expect(byName.get('create_transcription_callback')?.classification).toBe(
      'WRITE'
    );
  });

  test('audience counts match the coverage map', () => {
    const count = (audience: string) =>
      handWritten.filter((action) => action.audience === audience).length;
    expect([count('both'), count('human'), count('ai')]).toEqual([5, 11, 16]);
  });

  test('display names are unique across audiences', () => {
    const names = handWritten.map((action) => action.displayName);
    expect(new Set(names).size).toBe(names.length);
  });

  test('ai and both actions never point agents at human-only actions', () => {
    const humanNames = handWritten
      .filter((action) => action.audience === 'human')
      .map((action) => action.displayName);
    for (const action of handWritten.filter(
      (item) => item.audience !== 'human'
    )) {
      for (const name of humanNames) {
        const mention = new RegExp(`\\b${name}\\b(?! \\(Agent\\)| by ID)`);
        expect(action.aiMetadata?.description ?? '', action.name).not.toMatch(
          mention
        );
      }
    }
  });

  test('schema child paths are relative', () => {
    const paths = handWritten.flatMap((action) =>
      (action.outputSchema?.fields ?? []).flatMap((field) =>
        [...(field.listItems ?? []), ...(field.children ?? [])].map(
          (child) => child.value ?? child.key
        )
      )
    );
    expect(paths.filter((path) => path.includes('.'))).toEqual([]);
  });
});
