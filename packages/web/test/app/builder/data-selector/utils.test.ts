// @vitest-environment jsdom
// Importing the data-selector utils pulls in `@/features/pieces` → `src/lib/api.ts`,
// which reads `window.location.origin` at module load, so this suite needs a DOM.
import { FlowAction, FlowActionType } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { dataSelectorUtils } from '@/app/builder/data-selector/utils';

type TreeNode = ReturnType<typeof dataSelectorUtils.traverseStep>;

function collectPropertyPaths(node: TreeNode, acc: string[] = []): string[] {
  if (node.data.type === 'value' && typeof node.data.propertyPath === 'string') {
    acc.push(node.data.propertyPath);
  }
  node.children?.forEach((child) => collectPropertyPaths(child, acc));
  return acc;
}

const codeStep: FlowAction & { dfsIndex: number } = {
  name: 'step_1',
  type: FlowActionType.CODE,
  displayName: 'Code',
  valid: true,
  lastUpdatedDate: '2024-01-01T00:00:00.000Z',
  settings: {
    sourceCode: { code: '', packageJson: '{}' },
    input: {},
    sampleData: { lastTestDate: '2024-01-01T00:00:00.000Z' },
  },
  dfsIndex: 0,
};

describe('dataSelectorUtils.traverseStep — zipped array (flattenNestedKeys)', () => {
  it('nests the step reference under [\'output\'] in the flattenNestedKeys arg', () => {
    const tree = dataSelectorUtils.traverseStep(
      codeStep,
      { step_1: [{ a: 1 }, { a: 2 }] },
      true,
      'step_1',
    );

    const paths = collectPropertyPaths(tree);
    const flattenPaths = paths.filter((p) => p.startsWith('flattenNestedKeys('));

    expect(flattenPaths).toContain("flattenNestedKeys(step_1['output'], ['a'])");
    // The bug: the data arg must reference step_1['output'], never the bare step.
    expect(
      flattenPaths.some((p) => p.startsWith('flattenNestedKeys(step_1,')),
    ).toBe(false);
  });
});
