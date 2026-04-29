import { FlowActionType } from '@activepieces/shared';
import type { FlowAction } from '@activepieces/shared';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/features/pieces', () => ({
  pieceSelectorUtils: { isManualTrigger: () => false },
}));

import { dataSelectorUtils } from '@/app/builder/data-selector/utils';

type CodeStepFixture = FlowAction & { dfsIndex: number };

function makeCodeStep(): CodeStepFixture {
  return {
    name: 'step_1',
    displayName: 'My Step',
    dfsIndex: 0,
    valid: true,
    lastUpdatedDate: '2024-01-01',
    type: FlowActionType.CODE,
    settings: {
      sampleData: { lastTestDate: '2024-01-01' },
      sourceCode: { code: '', packageJson: '' },
      input: {},
    },
  };
}

describe('dataSelectorUtils.traverseStep', () => {
  function childDisplayNames(
    node: ReturnType<typeof dataSelectorUtils.traverseStep>,
  ): string[] {
    return (node.children ?? []).map((child) => {
      if (child.data.type === 'value') return child.data.displayName;
      if (child.data.type === 'chunk') return child.data.displayName;
      return child.data.stepName;
    });
  }

  it('labels array items with index when __displayName is absent', () => {
    const step = makeCodeStep();
    const node = dataSelectorUtils.traverseStep(
      step,
      { step_1: [{ value: 1 }, { value: 2 }] },
      false,
    );
    // root displayName is "1. My Step" (dfsIndex 0 → prefix "1.")
    expect(childDisplayNames(node)).toEqual([
      '1. My Step [1]',
      '1. My Step [2]',
    ]);
  });

  it('labels array items with __displayName when present', () => {
    const step = makeCodeStep();
    const node = dataSelectorUtils.traverseStep(
      step,
      {
        step_1: [
          { __displayName: 'First Item', value: 1 },
          { __displayName: 'Second Item', value: 2 },
        ],
      },
      false,
    );
    expect(childDisplayNames(node)).toEqual(['First Item', 'Second Item']);
  });

  it('applies __displayName per-item in a mixed array', () => {
    const step = makeCodeStep();
    const node = dataSelectorUtils.traverseStep(
      step,
      {
        step_1: [{ __displayName: 'Named Item', value: 1 }, { value: 2 }],
      },
      false,
    );
    expect(childDisplayNames(node)).toEqual(['Named Item', '1. My Step [2]']);
  });

  it('labels object children with the property key when __displayName is absent', () => {
    const step = makeCodeStep();
    const node = dataSelectorUtils.traverseStep(
      step,
      { step_1: { foo: 42, bar: 'hello' } },
      false,
    );
    expect(childDisplayNames(node)).toEqual(['foo', 'bar']);
  });

  it('labels an object child with __displayName from its value', () => {
    const step = makeCodeStep();
    const node = dataSelectorUtils.traverseStep(
      step,
      { step_1: { foo: { __displayName: 'My Foo', value: 1 } } },
      false,
    );
    expect(childDisplayNames(node)).toEqual(['My Foo']);
  });

  it('excludes the __displayName key itself from object children', () => {
    const step = makeCodeStep();
    const node = dataSelectorUtils.traverseStep(
      step,
      { step_1: { __displayName: 'Hidden', foo: 42 } },
      false,
    );
    const labels = (node.children ?? []).map((c) =>
      c.data.type === 'value' ? c.data.displayName : '',
    );
    expect(labels).not.toContain('__displayName');
    expect(labels).toContain('foo');
  });

  it('applies __displayName at every depth in a nested structure', () => {
    const step = makeCodeStep();
    const node = dataSelectorUtils.traverseStep(
      step,
      {
        step_1: {
          parent: {
            __displayName: 'Parent Label',
            items: [
              { __displayName: 'Row One', value: 1 },
              { __displayName: 'Row Two', value: 2 },
            ],
          },
        },
      },
      false,
    );

    expect(childDisplayNames(node)).toEqual(['Parent Label']);

    const parentNode = node.children?.[0];
    expect(parentNode).toBeDefined();
    // "items" has no __displayName on the array itself → key name used
    expect(childDisplayNames(parentNode!)).toEqual(['items']);

    const itemsNode = parentNode!.children?.[0];
    expect(itemsNode).toBeDefined();
    expect(childDisplayNames(itemsNode!)).toEqual(['Row One', 'Row Two']);
  });
});
