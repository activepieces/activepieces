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

  it('drills an undescribed object array into per-item nodes (show everything)', () => {
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
    expect(rowsNode?.data).toMatchObject({
      displayName: 'Rows',
      insertable: true,
    });
    expect(rowsNode?.children).toHaveLength(2);

    const firstItem = rowsNode?.children?.[0];
    expect(firstItem?.data).toMatchObject({ displayName: 'Item 1' });
    expect(
      firstItem?.data.type === 'value' && firstItem.data.propertyPath,
    ).toBe("step_1['output']['rows'][0]");

    const idNode = firstItem?.children?.[0];
    expect(idNode?.data).toMatchObject({
      displayName: 'Id',
      value: 1,
      insertable: true,
    });
    expect(idNode?.data.type === 'value' && idNode.data.propertyPath).toBe(
      "step_1['output']['rows'][0]['id']",
    );
  });

  it('drills a matrix field into rows and cells with indexed paths', () => {
    const schema: OutputSchema = {
      fields: [{ key: 'values', label: 'Values', value: 'values' }],
    };

    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: 'Sheet',
      schema,
      sampleData: {
        values: [
          ['Alice', 'alice@acme.com'],
          ['Bob', 'bob@acme.com'],
        ],
      },
    });

    const valuesNode = tree.children?.[0];
    expect(valuesNode?.data).toMatchObject({ displayName: 'Values' });
    expect(valuesNode?.children).toHaveLength(2);

    const firstRow = valuesNode?.children?.[0];
    expect(firstRow?.data).toMatchObject({
      displayName: 'Row 1',
      insertable: true,
    });
    expect(firstRow?.data.type === 'value' && firstRow.data.propertyPath).toBe(
      "step_1['output']['values'][0]",
    );
    expect(firstRow?.children).toHaveLength(2);

    const firstCell = firstRow?.children?.[0];
    expect(firstCell?.data).toMatchObject({
      displayName: 'Cell 1',
      value: 'Alice',
      insertable: true,
    });
    expect(
      firstCell?.data.type === 'value' && firstCell.data.propertyPath,
    ).toBe("step_1['output']['values'][0][0]");

    const secondCell = firstRow?.children?.[1];
    expect(
      secondCell?.data.type === 'value' && secondCell.data.propertyPath,
    ).toBe("step_1['output']['values'][0][1]");
  });

  it('drills an undescribed object field into its fields recursively', () => {
    const schema: OutputSchema = {
      fields: [{ key: 'sender', label: 'Sender', value: 'sender' }],
    };

    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: 'Step',
      schema,
      sampleData: {
        sender: { name: 'Ada', contact: { email: 'ada@acme.com' } },
      },
    });

    const senderNode = tree.children?.[0];
    expect(senderNode?.data).toMatchObject({ displayName: 'Sender' });
    expect(senderNode?.children).toHaveLength(2);

    const nameNode = senderNode?.children?.[0];
    expect(nameNode?.data).toMatchObject({
      displayName: 'Name',
      value: 'Ada',
      insertable: true,
    });

    const contactNode = senderNode?.children?.[1];
    const emailNode = contactNode?.children?.[0];
    expect(emailNode?.data).toMatchObject({
      displayName: 'Email',
      value: 'ada@acme.com',
      insertable: true,
    });
    expect(
      emailNode?.data.type === 'value' && emailNode.data.propertyPath,
    ).toBe("step_1['output']['sender']['contact']['email']");
  });

  it('renders described children when the value is an object', () => {
    const schema: OutputSchema = {
      fields: [
        {
          key: 'user',
          label: 'User',
          value: 'user',
          children: [{ key: 'email', format: 'email' }],
        },
      ],
    };

    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: 'Step',
      schema,
      sampleData: { user: { email: 'ada@acme.com', secret: 'x' } },
    });

    const userNode = tree.children?.[0];
    expect(userNode?.data).toMatchObject({ displayName: 'User' });
    // only the described child is exposed — the undescribed sibling is hidden
    expect(userNode?.children).toHaveLength(1);
    expect(userNode?.children?.[0]?.data).toMatchObject({
      displayName: 'Email',
      value: 'ada@acme.com',
    });
    expect(
      userNode?.children?.[0]?.data.type === 'value' &&
        userNode.children[0].data.propertyPath,
    ).toBe("step_1['output']['user']['email']");
  });

  it('ignores children and drills the value when children is declared but the value is a primitive array (mirrors the viewer)', () => {
    const schema: OutputSchema = {
      fields: [
        {
          key: 'labels',
          label: 'Labels',
          value: 'labels',
          children: [{ key: 'name' }],
        },
      ],
    };

    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: 'Step',
      schema,
      sampleData: { labels: ['urgent', 'inbox'] },
    });

    const labelsNode = tree.children?.[0];
    expect(labelsNode?.children).toHaveLength(2);
    expect(labelsNode?.children?.[0]?.data).toMatchObject({
      displayName: 'Labels 1',
      value: 'urgent',
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
    {
      key: 'ADS-69',
      fields: { summary: 'Booking issue', status: { name: 'To Do' } },
    },
    {
      key: 'ADS-66',
      fields: { summary: 'Email responses', status: { name: 'In Progress' } },
    },
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
    expect(
      firstItem?.data.type === 'value' && firstItem.data.propertyPath,
    ).toBe("step_1['output'][0]");

    const summaryNode = firstItem?.children?.[1];
    expect(summaryNode?.data).toMatchObject({
      displayName: 'Summary',
      value: 'Booking issue',
    });
    expect(
      summaryNode?.data.type === 'value' && summaryNode.data.propertyPath,
    ).toBe("step_1['output'][0]['fields']['summary']");
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

describe('schemaTreeUtils.buildTreeFromArray', () => {
  it('recurses into nested objects at any depth', () => {
    const tree = schemaTreeUtils.buildTreeFromArray({
      stepName: 'step_1',
      displayName: 'Step',
      items: [
        {
          payload: {
            customer: {
              address: {
                city: 'Amman',
              },
            },
          },
        },
      ],
    });

    const payloadNode = tree.children?.[0]?.children?.[0];
    expect(payloadNode?.data).toMatchObject({
      displayName: 'Payload',
      value: '',
    });

    const customerNode = payloadNode?.children?.[0];
    expect(customerNode?.data).toMatchObject({
      displayName: 'Customer',
      value: '',
    });

    const addressNode = customerNode?.children?.[0];
    expect(addressNode?.children).toHaveLength(1);

    const cityNode = addressNode?.children?.[0];
    expect(cityNode?.children).toBeUndefined();
    expect(cityNode?.data).toMatchObject({
      displayName: 'City',
      value: 'Amman',
      insertable: true,
    });
    expect(cityNode?.data.type === 'value' && cityNode.data.propertyPath).toBe(
      "step_1['output'][0]['payload']['customer']['address']['city']",
    );
  });

  it('expands arrays nested inside items instead of showing them raw', () => {
    const tree = schemaTreeUtils.buildTreeFromArray({
      stepName: 'step_1',
      displayName: 'Step',
      items: [{ tags: ['red', 'blue'] }],
    });

    const tagsNode = tree.children?.[0]?.children?.[0];
    expect(tagsNode?.data).toMatchObject({
      displayName: 'Tags',
      value: ['red', 'blue'],
    });
    expect(tagsNode?.children).toHaveLength(2);
    expect(tagsNode?.children?.[0]?.data).toMatchObject({
      displayName: 'Tags 1',
      value: 'red',
      insertable: true,
    });
    expect(
      tagsNode?.children?.[1]?.data.type === 'value' &&
        tagsNode.children[1].data.propertyPath,
    ).toBe("step_1['output'][0]['tags'][1]");
  });

  it('keeps primitive items as insertable leaves with a preview on object items', () => {
    const tree = schemaTreeUtils.buildTreeFromArray({
      stepName: 'step_1',
      displayName: 'Step',
      items: ['plain', { id: 7, name: 'Alpha' }],
    });

    expect(tree.children?.[0]?.data).toMatchObject({
      displayName: 'Item 1',
      value: 'plain',
      insertable: true,
    });
    expect(tree.children?.[0]?.children).toBeUndefined();

    expect(tree.children?.[1]?.data).toMatchObject({
      displayName: 'Item 2',
      value: '7 · Alpha',
    });
    expect(tree.children?.[1]?.children).toHaveLength(2);
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
    expect(first?.data.type === 'value' && first.data.propertyPath).toContain(
      "['uuid-1']",
    );
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

describe('schemaTreeUtils.buildTreeFromSchema — array-root wrapper (find-rows)', () => {
  const findRowsSchema: OutputSchema = {
    itemLabel: 'Row {row}',
    fields: [
      {
        key: 'rows',
        label: 'Found Rows',
        value: '',
        listItems: [
          { key: 'row', label: 'Row Number', value: 'row' },
          { key: 'values', label: 'Values', value: 'values', dynamicKey: true },
        ],
      },
    ],
  };

  const sampleData = [
    { row: 2, values: { Name: 'Alice', Email: 'alice@acme.com' } },
    { row: 3, values: { Name: 'Bob', Email: 'bob@acme.com' } },
  ];

  it('puts the wrapper field at the top and nests the rows beneath it', () => {
    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: '3. Find Rows',
      schema: findRowsSchema,
      sampleData,
    });

    // The single top child is the named wrapper, NOT an "Item 1".
    expect(tree.children).toHaveLength(1);
    const foundRows = tree.children?.[0];
    expect(foundRows?.data).toMatchObject({ displayName: 'Found Rows' });
    expect(
      foundRows?.data.type === 'value' && foundRows.data.propertyPath,
    ).toBe("step_1['output']");
    expect(foundRows?.children).toHaveLength(2);
  });

  it('labels each row via the itemLabel template (sheet row number)', () => {
    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: '3. Find Rows',
      schema: findRowsSchema,
      sampleData,
    });

    const rows = tree.children?.[0]?.children ?? [];
    expect(
      rows.map((r) => (r.data.type === 'value' ? r.data.displayName : '')),
    ).toEqual(['Row 2', 'Row 3']);
    expect(rows[0]?.data.type === 'value' && rows[0].data.propertyPath).toBe(
      "step_1['output'][0]",
    );
  });

  it('drills a dynamicKey listItem child (Values) into its keys with indexed paths', () => {
    const tree = schemaTreeUtils.buildTreeFromSchema({
      stepName: 'step_1',
      displayName: '3. Find Rows',
      schema: findRowsSchema,
      sampleData,
    });

    const firstRow = tree.children?.[0]?.children?.[0];
    const [rowNumberNode, valuesNode] = firstRow?.children ?? [];

    expect(rowNumberNode?.data).toMatchObject({
      displayName: 'Row Number',
      value: 2,
      insertable: true,
    });
    expect(
      rowNumberNode?.data.type === 'value' && rowNumberNode.data.propertyPath,
    ).toBe("step_1['output'][0]['row']");

    expect(valuesNode?.data).toMatchObject({ displayName: 'Values' });
    expect(valuesNode?.children).toHaveLength(2);
    const nameNode = valuesNode?.children?.[0];
    expect(nameNode?.data).toMatchObject({
      displayName: 'Name',
      value: 'Alice',
      insertable: true,
    });
    expect(nameNode?.data.type === 'value' && nameNode.data.propertyPath).toBe(
      "step_1['output'][0]['values']['Name']",
    );
  });
});

describe('schemaTreeUtils.selectArrayTreeKind', () => {
  it('returns "wrapper" for a whole-output wrapper schema (single value:"")', () => {
    expect(
      schemaTreeUtils.selectArrayTreeKind({
        fields: [{ key: 'rows', label: 'Found Rows', value: '' }],
      }),
    ).toBe('wrapper');
  });

  it('returns "perItem" for a per-item schema (fields describe each item)', () => {
    expect(
      schemaTreeUtils.selectArrayTreeKind({
        itemLabel: '{key}',
        fields: [{ key: 'key' }, { key: 'summary', value: 'fields.summary' }],
      }),
    ).toBe('perItem');
  });

  it('returns "plain" when there is no schema', () => {
    expect(schemaTreeUtils.selectArrayTreeKind(null)).toBe('plain');
    expect(schemaTreeUtils.selectArrayTreeKind(undefined)).toBe('plain');
  });
});
