// @vitest-environment jsdom
// Importing the data-selector utils pulls in `@/features/pieces` → `src/lib/api.ts`,
// which reads `window.location.origin` at module load, so this suite needs a DOM.
import { FlowAction, FlowActionType } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { DataSelectorTreeNode } from '@/app/builder/data-selector/type';
import { dataSelectorUtils } from '@/app/builder/data-selector/utils';

type TreeNode = ReturnType<typeof dataSelectorUtils.traverseStep>;

function collectPropertyPaths(node: TreeNode, acc: string[] = []): string[] {
  if (
    node.data.type === 'value' &&
    typeof node.data.propertyPath === 'string'
  ) {
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
  it("nests the step reference under ['output'] in the flattenNestedKeys arg", () => {
    const tree = dataSelectorUtils.traverseStep(
      codeStep,
      { step_1: [{ a: 1 }, { a: 2 }] },
      true,
      'step_1',
    );

    const paths = collectPropertyPaths(tree);
    const flattenPaths = paths.filter((p) =>
      p.startsWith('flattenNestedKeys('),
    );

    expect(flattenPaths).toContain(
      "flattenNestedKeys(step_1['output'], ['a'])",
    );
    // The bug: the data arg must reference step_1['output'], never the bare step.
    expect(
      flattenPaths.some((p) => p.startsWith('flattenNestedKeys(step_1,')),
    ).toBe(false);
  });
});

describe('dataSelectorUtils.filterBy — searchable value of containers', () => {
  const objectContainer: DataSelectorTreeNode = {
    key: 'obj',
    data: {
      type: 'value',
      value: { secret: 'hidden' },
      displayName: 'Obj',
      propertyPath: "step_1['output']['obj']",
      insertable: true,
    },
    children: [
      {
        key: 'field',
        data: {
          type: 'value',
          value: 'visible',
          displayName: 'Field',
          propertyPath: "step_1['output']['obj']['field']",
          insertable: true,
        },
      },
    ],
  };

  it('matches an object-valued container via its child leaf, not its stringified object', () => {
    expect(
      dataSelectorUtils.filterBy([objectContainer], 'visible'),
    ).toHaveLength(1);
    // 'hidden' lives only in the container's object value (not a child); the
    // container no longer stringifies that object, so it does not match.
    expect(
      dataSelectorUtils.filterBy([objectContainer], 'hidden'),
    ).toHaveLength(0);
  });

  it('still matches a container that carries a primitive value (zipped-view preview)', () => {
    const primitiveContainer: DataSelectorTreeNode = {
      key: 'data',
      data: {
        type: 'value',
        value: 'PRIMITIVE_TEXT',
        displayName: 'Data',
        propertyPath: "step_1['output']['data']",
        insertable: true,
      },
      children: [
        {
          key: 'nested',
          data: {
            type: 'value',
            value: 'deep',
            displayName: 'Nested',
            propertyPath: "step_1['output']['data']['nested']",
            insertable: true,
          },
        },
      ],
    };
    expect(
      dataSelectorUtils.filterBy([primitiveContainer], 'PRIMITIVE_TEXT'),
    ).toHaveLength(1);
  });
});
