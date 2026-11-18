import { describe, expect, it } from 'vitest';
import { streak } from '../src/index';
import { newBoxTrigger } from '../src/lib/triggers/new-box';

describe('triggers', () => {
  it('every trigger has an outputSchema whose top-level keys exist in its sample data', () => {
    for (const [name, trigger] of Object.entries(streak.triggers())) {
      const schema = trigger.outputSchema;
      expect(schema, name).toBeDefined();
      const sample = trigger.sampleData;
      const sampleKeys = typeof sample === 'object' && sample !== null ? Object.keys(sample) : [];
      for (const key of sampleKeys) {
        expect(schema?.fields.map((f) => f.key), `${name}.${key}`).toContain(key);
      }
    }
  });

  it('run returns the payload when it is an object and nothing otherwise', async () => {
    const runFn = newBoxTrigger.run;
    const ok = await Reflect.apply(runFn, newBoxTrigger, [{ payload: { body: { boxKey: 'b1' } } }]);
    const bad = await Reflect.apply(runFn, newBoxTrigger, [{ payload: { body: 'oops' } }]);
    expect(ok).toEqual([{ boxKey: 'b1' }]);
    expect(bad).toEqual([]);
  });
  it('run parses a JSON string object body into one item', async () => {
    const result = await Reflect.apply(newBoxTrigger.run, newBoxTrigger, [{ payload: { body: '{"boxKey":"b1"}' } }]);
    expect(result).toEqual([{ boxKey: 'b1' }]);
  });

  it('run parses a JSON string array body into one item per record', async () => {
    const result = await Reflect.apply(newBoxTrigger.run, newBoxTrigger, [
      { payload: { body: '[{"boxKey":"b1"},{"boxKey":"b2"}]' } },
    ]);
    expect(result).toEqual([{ boxKey: 'b1' }, { boxKey: 'b2' }]);
  });
});
