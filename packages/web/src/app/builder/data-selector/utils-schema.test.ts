import { describe, it, expect, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string) => key,
}));

import { DataSelectorTreeNode } from './type';
import { schemaTreeUtils } from './utils-schema';

function propertyPathOf(node: DataSelectorTreeNode): string | undefined {
  return node.data.type === 'value' ? node.data.propertyPath : undefined;
}

describe('schemaTreeUtils.buildTreeFromArray', () => {
  it("wraps primitive array item paths as step['output'][index]", () => {
    const tree = schemaTreeUtils.buildTreeFromArray({
      stepName: 'step_1',
      displayName: '1. Split',
      items: ['x', 'y'],
    });

    expect((tree.children ?? []).map(propertyPathOf)).toEqual([
      "step_1['output'][0]",
      "step_1['output'][1]",
    ]);
  });

  it("wraps object array item and field paths under ['output']", () => {
    const tree = schemaTreeUtils.buildTreeFromArray({
      stepName: 'step_1',
      displayName: '1. Split',
      items: [{ name: 'a' }, { name: 'b' }],
    });

    const firstItem = (tree.children ?? [])[0];
    expect(propertyPathOf(firstItem)).toBe("step_1['output'][0]");
    expect((firstItem.children ?? []).map(propertyPathOf)).toEqual([
      "step_1['output'][0]['name']",
    ]);
  });

  it("exposes the whole array as an insertable step['output'] root with a stepName", () => {
    const tree = schemaTreeUtils.buildTreeFromArray({
      stepName: 'step_1',
      displayName: '1. Split',
      items: ['x'],
    });

    expect(tree.data.type).toBe('value');
    if (tree.data.type === 'value') {
      expect(tree.data.propertyPath).toBe("step_1['output']");
      expect(tree.data.insertable).toBe(true);
      expect(tree.data.stepName).toBe('step_1');
    }
  });
});

describe('schemaTreeUtils.buildTreeFromSchema', () => {
  it("wraps schema field paths under ['output'] and keeps a stepName for the icon", () => {
    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: '1. Custom API Call',
      schema: { fields: [{ key: 'name' }] },
      sampleData: { name: 'abc' },
    });

    expect(tree.data.type).toBe('value');
    if (tree.data.type === 'value') {
      expect(tree.data.stepName).toBe('step_1');
    }
    expect((tree.children ?? []).map(propertyPathOf)).toEqual([
      "step_1['output']['name']",
    ]);
  });
});
