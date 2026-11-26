import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { OutputSchemaField } from '@activepieces/pieces-framework';
import { apollo } from '../src/index';

const capturesDir = process.env['APOLLO_CAPTURES_DIR'] ?? '';
const enabled = capturesDir !== '' && existsSync(capturesDir);

const OPTIONAL_IN_RAW = ['account_id'];

const RAW_PASSTHROUGH = ['matchPerson', 'enrichCompany', 'peopleSearch', 'organizationSearch', 'newsArticlesSearch', 'organizationJobPostings'];

function score({ fields, value, path: prefix, strict }: { fields: OutputSchemaField[]; value: unknown; path: string; strict: boolean }): string[] {
  if (Array.isArray(value)) {
    const itemFields = fields.length === 1 && fields[0].value === '' ? fields[0].listItems ?? [] : fields;
    return value.flatMap((item) => score({ fields: itemFields, value: item, path: `${prefix}[].`, strict }));
  }
  if (value === null || typeof value !== 'object') {
    return [];
  }
  const keys = Object.keys(value);
  const modelled = fields.map((field) => field.value ?? field.key);
  const dead = modelled.filter((key) => key !== '' && !keys.includes(key) && (strict || !OPTIONAL_IN_RAW.includes(key))).map((key) => `dead ${prefix}${key}`);
  const unmodelled = strict ? keys.filter((key) => !modelled.includes(key)).map((key) => `unmodelled ${prefix}${key}`) : [];
  const nested = fields.flatMap((field) => {
    const child: unknown = Reflect.get(value, field.value ?? field.key);
    const fromChildren = field.children ? score({ fields: field.children, value: child, path: `${prefix}${field.key}.`, strict }) : [];
    const fromItems = field.listItems && Array.isArray(child) ? child.flatMap((item) => score({ fields: field.listItems ?? [], value: item, path: `${prefix}${field.key}[].`, strict })) : [];
    return [...fromChildren, ...fromItems];
  });
  return [...dead, ...unmodelled, ...nested];
}

function captureTargets(): { file: string; name: string; kind: 'action' | 'trigger' }[] {
  const actionNames = Object.values(apollo.actions()).map((action) => action.name);
  const triggerNames = Object.values(apollo.triggers()).map((trigger) => trigger.name);
  return readdirSync(capturesDir)
    .filter((file) => file.endsWith('.json'))
    .flatMap((file) => {
      const base = file.replace(/\.json$/, '');
      const triggerName = triggerNames.find((name) => base === `trigger_${name}` || base.startsWith(`trigger_${name}_`));
      if (triggerName) {
        return [{ file, name: triggerName, kind: 'trigger' as const }];
      }
      const actionName = [...actionNames].sort((a, b) => b.length - a.length).find((name) => base === name || base.startsWith(`${name}_`));
      return actionName && actionName !== 'custom_api_call' ? [{ file, name: actionName, kind: 'action' as const }] : [];
    });
}

describe.skipIf(!enabled)('live captures match the output schemas (both directions)', () => {
  const targets = enabled ? captureTargets() : [];

  test('captures exist', () => {
    expect(targets.length).toBeGreaterThan(0);
  });

  test.each(targets)('$file', ({ file, name, kind }) => {
    const value: unknown = JSON.parse(readFileSync(path.join(capturesDir, file), 'utf8'));
    if (kind === 'trigger') {
      const trigger = Object.values(apollo.triggers()).find((item) => item.name === name);
      const items = Array.isArray(value) ? value : [value];
      const problems = items.flatMap((item) => score({ fields: trigger?.outputSchema?.fields ?? [], value: item, path: '', strict: true }));
      expect(problems).toEqual([]);
      return;
    }
    const action = Object.values(apollo.actions()).find((item) => item.name === name);
    const strict = !RAW_PASSTHROUGH.includes(name);
    expect(score({ fields: action?.outputSchema?.fields ?? [], value, path: '', strict })).toEqual([]);
  });
});
