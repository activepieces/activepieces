import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { OutputSchema } from '@activepieces/pieces-framework';
import { describe, expect, test } from 'vitest';
import { firefliesAi } from '../src/index';
import { MEETING_SAMPLE_DATA } from '../src/lib/common/webhook';

const actions = Object.values(firefliesAi.actions());
const triggers = Object.values(firefliesAi.triggers());

describe('piece metadata', () => {
  test('minimumSupportedRelease is 0.88.2, the floor for ai atomics and for propertyGroups/advanced props', () => {
    expect(firefliesAi.minimumSupportedRelease).toBe('0.88.2');
  });

  test('audiences match the plan', () => {
    const audience = Object.fromEntries(actions.map((action) => [action.name, action.audience]));
    expect(audience).toEqual({
      'find-meeting-by-id': 'human',
      find_recent_meeting: 'human',
      find_meeting_by_query: 'human',
      upload_audio: 'both',
      'get-user-details': 'both',
      search_meetings: 'ai',
      get_meeting: 'ai',
      get_meeting_summary: 'ai',
      get_meeting_transcript: 'ai',
      get_current_user: 'ai',
      list_users: 'ai',
      list_channels: 'ai',
      list_contacts: 'ai',
      move_meetings_to_channel: 'ai',
      update_meeting_title: 'ai',
      update_meeting_privacy: 'ai',
      share_meeting: 'ai',
      revoke_meeting_access: 'ai',
      delete_meeting: 'ai',
      ask_fred: 'ai',
      create_soundbite: 'ai',
      add_bot_to_live_meeting: 'ai',
      custom_api_call: 'human',
    });
  });

  test('every action, including Custom API Call, has an outputSchema, classification and aiMetadata', () => {
    for (const action of actions) {
      expect(action.outputSchema, action.name).toBeDefined();
      expect(action.classification, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
    }
  });

  test('every trigger has sampleData, an outputSchema and aiMetadata', () => {
    expect(triggers.map((trigger) => trigger.name).sort()).toEqual(['meeting_summarized', 'new_transcription_completed']);
    for (const trigger of triggers) {
      expect(trigger.sampleData, trigger.name).toBeDefined();
      expect(trigger.outputSchema, trigger.name).toBeDefined();
      expect(trigger.aiMetadata?.description, trigger.name).toBeTruthy();
    }
  });

  test('display names are unique, and the AI search tool is named Find Meetings', () => {
    const names = actions.map((action) => action.displayName);
    expect(new Set(names).size).toBe(names.length);
    const byKey = Object.fromEntries(actions.map((action) => [action.name, action.displayName]));
    expect(byKey['search_meetings']).toBe('Find Meetings');
  });

  test('prose only names siblings that exist', () => {
    const displayNames = new Set(actions.map((action) => action.displayName));
    const mentioned = ['Get Meeting', 'Get Meeting Summary', 'Get Meeting Transcript', 'Get Current User', 'List Users', 'List Channels', 'Find Meetings', 'Revoke Meeting Access', 'Move Meetings to Channel', 'Get User Details', 'Ask Fred'];
    for (const name of mentioned) {
      expect(displayNames.has(name), name).toBe(true);
    }
  });
});

describe('schema scorer', () => {
  test('finds dead and unmodelled fields at the right scope', () => {
    const schema: OutputSchema = {
      fields: [
        { key: 'id' },
        { key: 'gone' },
        { key: 'items', listItems: [{ key: 'name' }, { key: 'missing' }] },
        { key: 'nested', children: [{ key: 'a' }] },
      ],
    };
    const result = scoreSchema({ schema, output: { id: 1, extra: true, items: [{ name: 'x', other: 1 }], nested: { a: 1, b: 2 } } });
    expect(result.dead.sort()).toEqual(['gone', 'items[].missing']);
    expect(result.unmodelled.sort()).toEqual(['extra', 'items[].other', 'nested.b']);
  });
});

describe('trigger sampleData against the trigger schemas', () => {
  test.each(triggers.map((trigger) => [trigger.name, trigger]))('%s scores clean in both directions', (_name, trigger) => {
    expect(trigger.outputSchema).toBeDefined();
    if (trigger.outputSchema) {
      expect(scoreSchema({ schema: trigger.outputSchema, output: MEETING_SAMPLE_DATA })).toEqual({ dead: [], unmodelled: [] });
    }
  });
});

describe('live captures', () => {
  const capturesDir = process.env['FIREFLIES_CAPTURES_DIR'];
  const steps = [...actions, ...triggers].filter((step) => step.outputSchema !== undefined);
  const available = capturesDir ? steps.filter((step) => existsSync(path.join(capturesDir, `${step.name}.json`))) : [];

  test.skipIf(available.length === 0)('each captured step output scores clean in both directions', () => {
    const report = available.map((step) => {
      const raw: unknown = JSON.parse(readFileSync(path.join(capturesDir ?? '', `${step.name}.json`), 'utf8'));
      const outputs = Array.isArray(raw) && triggers.some((trigger) => trigger.name === step.name) ? raw : [raw];
      const scores = outputs.map((output) => (step.outputSchema ? scoreSchema({ schema: step.outputSchema, output }) : { dead: [], unmodelled: [] }));
      return {
        step: step.name,
        dead: [...new Set(scores.flatMap((score) => score.dead))],
        unmodelled: [...new Set(scores.flatMap((score) => score.unmodelled))],
      };
    });
    expect(report.filter((entry) => entry.dead.length > 0 || entry.unmodelled.length > 0)).toEqual([]);
  });
});

function scoreSchema({ schema, output }: { schema: OutputSchema; output: unknown }): SchemaScore {
  return scoreFields({ fields: schema.fields, value: output, prefix: '' });
}

function scoreFields({ fields, value, prefix }: { fields: OutputSchema['fields']; value: unknown; prefix: string }): SchemaScore {
  const dead: string[] = [];
  const unmodelled: string[] = [];
  for (const field of fields) {
    const fieldPath = field.value ?? field.key;
    const label = `${prefix}${fieldPath === '' ? field.key : fieldPath}`;
    const resolved = fieldPath === '' ? value : resolvePath({ value, fieldPath });
    if (resolved === undefined) {
      dead.push(label);
      continue;
    }
    if (field.children && isRecord(resolved)) {
      const inner = scoreFields({ fields: field.children, value: resolved, prefix: `${label}.` });
      dead.push(...inner.dead);
      unmodelled.push(...inner.unmodelled);
    }
    if (field.listItems && Array.isArray(resolved)) {
      const items = resolved.filter(isRecord);
      const scores = items.map((item) => scoreFields({ fields: field.listItems ?? [], value: item, prefix: `${label}[].` }));
      const deadEverywhere = scores.length === 0 ? [] : scores[0].dead.filter((entry) => scores.every((score) => score.dead.includes(entry)));
      dead.push(...deadEverywhere);
      unmodelled.push(...new Set(scores.flatMap((score) => score.unmodelled)));
    }
  }
  if (isRecord(value)) {
    const modelled = new Set(fields.filter((field) => (field.value ?? field.key) !== '').map((field) => (field.value ?? field.key).split('.')[0]));
    unmodelled.push(...Object.keys(value).filter((key) => !modelled.has(key)).map((key) => `${prefix}${key}`));
  }
  return { dead, unmodelled };
}

function resolvePath({ value, fieldPath }: { value: unknown; fieldPath: string }): unknown {
  return fieldPath.split('.').reduce<unknown>((current, segment) => (isRecord(current) ? current[segment] : undefined), value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

type SchemaScore = { dead: string[]; unmodelled: string[] };
