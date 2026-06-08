import { describe, it, expect, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string) => key,
}));

import { schemaTreeUtils } from '@/app/builder/data-selector/utils-schema';
import type { OutputSchema } from '@/components/custom/smart-output-viewer/types';

function childDisplayNames(
  node: ReturnType<typeof schemaTreeUtils.buildTreeFromArrayWithSchema>,
): string[] {
  return (node.children ?? []).map((child) =>
    child.data.type === 'value' ? child.data.displayName : '',
  );
}

describe('schemaTreeUtils.buildTreeFromSchema — primitive arrays', () => {
  it('expands a primitive array schema into per-item insertable nodes', () => {
    const schema: OutputSchema = {
      fields: [
        {
          key: 'labelIds',
          label: 'Labels',
          value: 'thread.data.messages[0].labelIds',
        },
      ],
    };
    const sampleData = {
      thread: {
        data: {
          messages: [{ labelIds: ['UNREAD', 'CATEGORY_UPDATES', 'INBOX'] }],
        },
      },
    };

    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: 'Gmail',
      schema,
      sampleData,
    });

    const labelsNode = tree.children?.[0];
    expect(labelsNode).toBeDefined();
    expect(labelsNode?.data).toMatchObject({
      type: 'value',
      displayName: 'Labels',
      insertable: true,
    });
    expect(labelsNode?.children).toHaveLength(3);

    const firstItem = labelsNode?.children?.[0];
    expect(firstItem?.data).toMatchObject({
      type: 'value',
      value: 'UNREAD',
      displayName: 'Labels 1',
      insertable: true,
    });
    expect(
      firstItem?.data.type === 'value' && firstItem.data.propertyPath,
    ).toContain('[0]');

    const secondItem = labelsNode?.children?.[1];
    expect(secondItem?.data).toMatchObject({
      type: 'value',
      value: 'CATEGORY_UPDATES',
      displayName: 'Labels 2',
      insertable: true,
    });
  });

  it('returns no children for an empty primitive array', () => {
    const schema: OutputSchema = {
      fields: [{ key: 'tags', value: 'tags' }],
    };

    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: 'Step',
      schema,
      sampleData: { tags: [] },
    });

    const tagsNode = tree.children?.[0];
    expect(tagsNode).toBeDefined();
    expect(tagsNode?.children).toBeUndefined();
    expect(tagsNode?.data).toMatchObject({
      value: [],
      displayName: 'Tags',
      insertable: true,
    });
  });

  it('still uses listItems when explicitly provided (object array)', () => {
    const schema: OutputSchema = {
      fields: [
        {
          key: 'attachments',
          value: 'attachments',
          listItems: [{ key: 'fileName' }, { key: 'size', format: 'filesize' }],
        },
      ],
    };

    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: 'Step',
      schema,
      sampleData: {
        attachments: [
          { fileName: 'a.pdf', size: 1024 },
          { fileName: 'b.pdf', size: 2048 },
        ],
      },
    });

    const attachmentsNode = tree.children?.[0];
    expect(attachmentsNode?.data).toMatchObject({
      displayName: 'Attachments',
      insertable: false,
    });
    expect(attachmentsNode?.children).toHaveLength(2);
    expect(attachmentsNode?.children?.[0].data).toMatchObject({
      displayName: 'Attachments 1',
    });
    expect(attachmentsNode?.children?.[0].children).toHaveLength(2);
  });

  it('does not auto-expand arrays that contain objects when no listItems is set', () => {
    const schema: OutputSchema = {
      fields: [{ key: 'rows', value: 'rows' }],
    };

    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: 'Step',
      schema,
      sampleData: { rows: [{ id: 1 }, { id: 2 }] },
    });

    const rowsNode = tree.children?.[0];
    expect(rowsNode?.children).toBeUndefined();
    expect(rowsNode?.data).toMatchObject({
      displayName: 'Rows',
      insertable: true,
    });
  });
});

describe('schemaTreeUtils.buildTreeFromArrayWithSchema', () => {
  const issueSchema: OutputSchema = {
    itemLabel: '{key}: {fields.summary}',
    fields: [
      { key: 'key', label: 'Key' },
      { key: 'summary', label: 'Summary', value: 'fields.summary' },
      { key: 'status', label: 'Status', value: 'fields.status.name' },
    ],
  };

  const issues = [
    { key: 'ADS-69', fields: { summary: 'Booking issue', status: { name: 'To Do' } } },
    { key: 'ADS-66', fields: { summary: 'Email responses', status: { name: 'In Progress' } } },
  ];

  it('labels each item via the itemLabel template', () => {
    const tree = schemaTreeUtils.buildTreeFromArrayWithSchema({
      stepName: 'step_1',
      displayName: 'Search Issues',
      schema: issueSchema,
      items: issues,
    });

    expect(childDisplayNames(tree)).toEqual([
      'ADS-69: Booking issue',
      'ADS-66: Email responses',
    ]);
  });

  it('resolves each field against its own item with a bracketed indexed path', () => {
    const tree = schemaTreeUtils.buildTreeFromArrayWithSchema({
      stepName: 'step_1',
      displayName: 'Search Issues',
      schema: issueSchema,
      items: issues,
    });

    const firstItem = tree.children?.[0];
    expect(firstItem?.data.type === 'value' && firstItem.data.propertyPath).toBe(
      'step_1[0]',
    );

    const summaryNode = firstItem?.children?.[1];
    expect(summaryNode?.data).toMatchObject({
      displayName: 'Summary',
      value: 'Booking issue',
    });
    expect(
      summaryNode?.data.type === 'value' && summaryNode.data.propertyPath,
    ).toBe("step_1[0]['fields']['summary']");
  });

  it('falls back to Item N when no itemLabel is set', () => {
    const tree = schemaTreeUtils.buildTreeFromArrayWithSchema({
      stepName: 'step_1',
      displayName: 'Search Issues',
      schema: { fields: issueSchema.fields },
      items: issues,
    });

    expect(childDisplayNames(tree)).toEqual(['Item 1', 'Item 2']);
  });
});

describe('schemaTreeUtils.buildTreeFromSchema — labelKey', () => {
  it('labels dynamicKey entries by labelKey while keeping the opaque-key path', () => {
    const schema: OutputSchema = {
      fields: [
        { key: 'boards', label: 'Boards', dynamicKey: true, labelKey: 'name' },
      ],
    };

    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: 'Step',
      schema,
      sampleData: {
        boards: {
          'uuid-1': { name: 'Roadmap', id: 'uuid-1' },
          'uuid-2': { name: 'Backlog', id: 'uuid-2' },
        },
      },
    });

    const boardsNode = tree.children?.[0];
    expect(boardsNode?.children).toHaveLength(2);

    const first = boardsNode?.children?.[0];
    expect(first?.data).toMatchObject({
      type: 'value',
      displayName: 'Roadmap',
      insertable: true,
    });
    expect(
      first?.data.type === 'value' && first.data.propertyPath,
    ).toContain("['uuid-1']");
  });

  it('falls back to the raw key when labelKey is missing on an entry', () => {
    const schema: OutputSchema = {
      fields: [
        { key: 'boards', label: 'Boards', dynamicKey: true, labelKey: 'name' },
      ],
    };

    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: 'Step',
      schema,
      sampleData: { boards: { 'uuid-1': { id: 'uuid-1' } } },
    });

    expect(tree.children?.[0]?.children?.[0]?.data).toMatchObject({
      displayName: 'uuid-1',
    });
  });

  it('labels listItems by labelKey, falling back to Item N when absent', () => {
    const schema: OutputSchema = {
      fields: [
        {
          key: 'items',
          label: 'Items',
          labelKey: 'name',
          listItems: [{ key: 'id' }, { key: 'name' }],
        },
      ],
    };

    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: 'Step',
      schema,
      sampleData: {
        items: [{ id: 'a', name: 'Alpha' }, { id: 'b' }],
      },
    });

    const itemsNode = tree.children?.[0];
    expect(itemsNode?.children?.[0]?.data).toMatchObject({
      displayName: 'Alpha',
    });
    expect(itemsNode?.children?.[1]?.data).toMatchObject({
      displayName: 'Items 2',
    });
  });
});
