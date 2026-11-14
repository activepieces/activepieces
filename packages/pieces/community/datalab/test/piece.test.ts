import { describe, expect, it } from 'vitest';
import { datalab } from '../src/index';
import { datalabClient } from '../src/lib/common/client';
import { fillOperation } from '../src/lib/operations/fill';

function isOptionalCheckbox(prop: unknown): boolean {
  if (typeof prop !== 'object' || prop === null || !('type' in prop) || prop.type !== 'CHECKBOX') {
    return false;
  }
  return !('required' in prop) || prop.required !== true;
}

function schemaKeys(schema: unknown): string[] {
  if (typeof schema !== 'object' || schema === null || !('fields' in schema) || !Array.isArray(schema.fields)) {
    return [];
  }
  return schema.fields.map((field: unknown) => (typeof field === 'object' && field !== null && 'key' in field ? String(field.key) : ''));
}

describe('datalab piece', () => {
  const actions = Object.values(datalab.actions());
  const handWritten = actions.filter((action) => action.name !== 'custom_api_call');
  const names = actions.map((action) => action.name).sort();

  it('loads the 13 planned actions and no triggers', () => {
    expect(names).toEqual(
      [
        'ai_convert_document',
        'ai_extract_structured_data',
        'ai_fill_form',
        'ai_get_form_fields',
        'ai_segment_document',
        'convert_document',
        'create_document',
        'custom_api_call',
        'extract_structured_data',
        'fill_form',
        'get_form_fields',
        'get_result',
        'segment_document',
      ].sort(),
    );
    expect(Object.keys(datalab.triggers())).toEqual([]);
  });

  it('gives every hand-written action an audience, a classification, aiMetadata and an output schema', () => {
    for (const action of handWritten) {
      expect(action.audience, action.name).toMatch(/^(human|ai|both)$/);
      expect(action.classification, action.name).toBe('READ');
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(action.aiMetadata?.idempotent, action.name).toBe(true);
      expect(action.outputSchema, action.name).toBeDefined();
    }
  });

  it('says in every agent-facing description that a run spends Datalab credits', () => {
    for (const action of handWritten.filter((entry) => entry.name !== 'get_result')) {
      expect(action.aiMetadata?.description, action.name).toMatch(/credit/i);
    }
  });

  it('prefixes every ai action name with ai_ and pairs it with a human action of the same display name', () => {
    const aiActions = handWritten.filter((entry) => entry.audience === 'ai');
    expect(aiActions.length).toBe(5);
    for (const action of aiActions) {
      expect(action.name, action.name).toMatch(/^ai_/);
      const human = handWritten.find((entry) => entry.name === action.name.replace(/^ai_/, ''));
      expect(human?.audience, action.name).toBe('human');
      expect(human?.displayName, action.name).toBe(action.displayName);
    }
  });

  it('never gives an ai action the display name of a both action', () => {
    const bothNames = new Set(handWritten.filter((action) => action.audience === 'both').map((action) => action.displayName));
    expect([...bothNames].sort()).toEqual(['Create Document', 'Get Result']);
    const clashes = handWritten.filter((action) => action.audience === 'ai' && bothNames.has(action.displayName)).map((action) => action.name);
    expect(clashes).toEqual([]);
  });

  it('gives the human document actions a source choice and the ai twins a single required file URL', () => {
    for (const action of handWritten.filter((entry) => entry.audience === 'human')) {
      expect(Object.keys(action.props), action.name).toEqual(expect.arrayContaining(['source', 'file', 'file_url']));
    }
    for (const action of handWritten.filter((entry) => entry.audience === 'ai')) {
      expect(Object.keys(action.props), action.name).toContain('file_url');
      expect(Object.keys(action.props), action.name).not.toContain('file');
      expect(action.props['file_url'].required, action.name).toBe(true);
    }
  });

  it('defaults every optional checkbox to off, so an agent that omits it gets the safe behaviour', () => {
    const offenders: string[] = [];
    for (const action of handWritten) {
      for (const [key, prop] of Object.entries(action.props)) {
        if (isOptionalCheckbox(prop) && 'defaultValue' in prop && prop.defaultValue === true) {
          offenders.push(`${action.name}.${key}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('marks only optional props as advanced', () => {
    const offenders: string[] = [];
    for (const action of handWritten) {
      for (const [key, prop] of Object.entries(action.props)) {
        if ('advanced' in prop && prop.advanced === true && prop.required === true) {
          offenders.push(`${action.name}.${key}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('starts every output schema with the completed, status and request ID fields and exposes no secrets or base64', () => {
    for (const action of handWritten) {
      const keys = schemaKeys(action.outputSchema);
      expect(keys.slice(0, 3), action.name).toEqual(['completed', 'status', 'request_id']);
      expect(keys.join(' '), action.name).not.toMatch(/base64|api_key|authorization|header/i);
    }
  });

  it('warns people and agents up front that Fill Form is slow, with the wait each of them gets', () => {
    const human = handWritten.find((action) => action.name === 'fill_form');
    const ai = handWritten.find((action) => action.name === 'ai_fill_form');
    for (const action of [human, ai]) {
      expect(action?.description, action?.name).toMatch(/Slow action: one page usually takes 1 to 4 minutes/);
      expect(action?.aiMetadata?.description, action?.name).toMatch(/Slow action: one page usually takes 1 to 4 minutes, so a long wait is normal/);
    }
    expect(fillOperation.HUMAN_WAIT_MINUTES).toBe(fillOperation.HUMAN_MAX_WAIT_MS / 60_000);
    expect(fillOperation.AI_WAIT_MINUTES).toBe(datalabClient.MAX_WAIT_MS / 60_000);
    expect(human?.description).toContain(`waits up to ${fillOperation.HUMAN_WAIT_MINUTES} minutes`);
    expect(human?.aiMetadata?.description).toContain(`waits up to ${fillOperation.HUMAN_WAIT_MINUTES} minutes`);
    expect(ai?.description).toContain(`the ${fillOperation.AI_WAIT_MINUTES} minute wait`);
    expect(ai?.aiMetadata?.description).toContain(`waits up to ${fillOperation.AI_WAIT_MINUTES} minutes`);
    expect(fillOperation.USUAL_TIME).toBe('1 to 4 minutes');
  });

  it('opens the human Fill Form form with a notice that the action is slow, and gives the agent no notice prop', () => {
    const human = handWritten.find((action) => action.name === 'fill_form');
    const ai = handWritten.find((action) => action.name === 'ai_fill_form');
    expect(Object.keys(human?.props ?? {})[0]).toBe('slow_notice');
    expect(human?.props['slow_notice']).toMatchObject({ type: 'MARKDOWN', variant: 'INFO' });
    expect(JSON.stringify(human?.props['slow_notice'])).toMatch(/This action is slow.*usually takes 1 to 4 minutes.*waits up to 6 minutes/);
    expect(Object.keys(ai?.props ?? {})).not.toContain('slow_notice');
  });

  it('keeps the custom API call for humans only', () => {
    const custom = actions.find((action) => action.name === 'custom_api_call');
    expect(custom?.audience).toBe('human');
  });
});
