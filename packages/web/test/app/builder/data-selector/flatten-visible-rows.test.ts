// @vitest-environment jsdom
// Importing the data-selector utils pulls in `@/features/pieces` → `src/lib/api.ts`,
// which reads `window.location.origin` at module load, so this suite needs a DOM.
import { describe, expect, it } from 'vitest';

import { DataSelectorTreeNode } from '@/app/builder/data-selector/type';
import { dataSelectorUtils } from '@/app/builder/data-selector/utils';

const leaf = (key: string, value: string): DataSelectorTreeNode => ({
  key,
  data: {
    type: 'value',
    value,
    displayName: key,
    propertyPath: `step_1['output']['${key}']`,
    insertable: true,
  },
});

const branch = (
  key: string,
  children: DataSelectorTreeNode[],
): DataSelectorTreeNode => ({
  key,
  data: {
    type: 'value',
    value: {},
    displayName: key,
    propertyPath: `step_1['output']['${key}']`,
    insertable: true,
  },
  children,
});

const deepTree = [
  branch('root', [
    branch('level1', [branch('level2', [branch('level3', [leaf('amount', '5')])])]),
  ]),
];

const countNodes = (nodes: DataSelectorTreeNode[]): number =>
  nodes.reduce((a, n) => a + 1 + (n.children ? countNodes(n.children) : 0), 0);

const flatten = ({
  nodes = deepTree,
  searchActive,
  overrides = new Map<string, boolean>(),
}: {
  nodes?: DataSelectorTreeNode[];
  searchActive: boolean;
  overrides?: Map<string, boolean>;
}) =>
  dataSelectorUtils.flattenVisibleRows({ nodes, searchActive, overrides });

describe('dataSelectorUtils.flattenVisibleRows', () => {
  it('shows only step roots when no search is active', () => {
    const rows = flatten({ searchActive: false });

    expect(rows.map((r) => r.node.key)).toEqual(['root', 'level1']);
    expect(rows[0].depth).toBe(0);
    expect(rows[0].expanded).toBe(true);
    expect(rows[1].expanded).toBe(false);
  });

  it('reveals a match nested four levels deep while a search is active', () => {
    const rows = flatten({ searchActive: true });

    expect(rows).toHaveLength(countNodes(deepTree));
    const match = rows.find((r) => r.node.key === 'amount');
    expect(match).toBeDefined();
    expect(match?.depth).toBe(4);
  });

  it('keeps a node the user collapsed mid-search collapsed, hiding its subtree', () => {
    const all = flatten({ searchActive: true });
    const level1 = all.find((r) => r.node.key === 'level1');
    expect(level1).toBeDefined();

    const rows = flatten({
      searchActive: true,
      overrides: new Map([[level1!.id, false]]),
    });

    expect(rows.map((r) => r.node.key)).toEqual(['root', 'level1']);
  });

  it('lets the user expand a branch while no search is active', () => {
    const collapsed = flatten({ searchActive: false });
    const level1 = collapsed.find((r) => r.node.key === 'level1');

    const rows = flatten({
      searchActive: false,
      overrides: new Map([[level1!.id, true]]),
    });

    expect(rows.map((r) => r.node.key)).toEqual([
      'root',
      'level1',
      'level2',
    ]);
  });

  it('never marks a childless node expanded', () => {
    const rows = flatten({ searchActive: true });
    const leaves = rows.filter((r) => !r.node.children?.length);

    expect(leaves.length).toBeGreaterThan(0);
    expect(leaves.every((r) => r.expanded === false)).toBe(true);
  });

  it('keeps a row id stable when a sibling is inserted before it', () => {
    const before = flatten({
      nodes: [branch('a', [leaf('x', '1')]), branch('b', [leaf('y', '2')])],
      searchActive: true,
    });
    const after = flatten({
      nodes: [
        branch('a', [leaf('x', '1')]),
        branch('inserted', [leaf('z', '3')]),
        branch('b', [leaf('y', '2')]),
      ],
      searchActive: true,
    });

    const idOf = (rows: typeof before, key: string) =>
      rows.find((r) => r.node.key === key)?.id;

    expect(idOf(after, 'b')).toBe(idOf(before, 'b'));
    expect(idOf(after, 'y')).toBe(idOf(before, 'y'));
  });

  it('keeps a user override on the same logical node when the tree gains a sibling', () => {
    const nodesBefore = [
      branch('a', [leaf('x', '1')]),
      branch('b', [leaf('y', '2')]),
    ];
    const collapsedB = flatten({ nodes: nodesBefore, searchActive: true }).find(
      (r) => r.node.key === 'b',
    );
    const overrides = new Map([[collapsedB!.id, false]]);

    const after = flatten({
      nodes: [
        branch('a', [leaf('x', '1')]),
        branch('inserted', [leaf('z', '3')]),
        branch('b', [leaf('y', '2')]),
      ],
      searchActive: true,
      overrides,
    });

    expect(after.find((r) => r.node.key === 'b')?.expanded).toBe(false);
    expect(after.find((r) => r.node.key === 'inserted')?.expanded).toBe(true);
    expect(after.some((r) => r.node.key === 'y')).toBe(false);
    expect(after.some((r) => r.node.key === 'z')).toBe(true);
  });

  it('keeps ids distinct when property names contain the id delimiters', () => {
    // Output keys are arbitrary JSON property names, so they can contain the
    // "/" separator and the "#N" occurrence marker used to build row ids.
    const delimiterKeys = [
      branch('a/b', [leaf('deep', '1')]),
      branch('a', [branch('b', [leaf('deep', '2')])]),
      leaf('c', '3'),
      leaf('c', '4'),
      leaf('c#1', '5'),
    ];

    const rows = flatten({ nodes: delimiterKeys, searchActive: true });
    const ids = rows.map((r) => r.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives distinct ids to sibling subtrees that reuse the same node key', () => {
    // The zipped array view keys nodes by bare property name
    // (convertArrayToZippedView), so node.key repeats across branches.
    const duplicateKeys = [
      branch('a', [leaf('id', '1')]),
      branch('b', [leaf('id', '2')]),
    ];

    const rows = flatten({ nodes: duplicateKeys, searchActive: true });
    const ids = rows.map((r) => r.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
