import { describe, it, expect, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string) => key,
}));

import { hintsTreeUtils } from '@/app/builder/data-selector/utils-hints';
import type { OutputDisplayHints } from '@/components/custom/smart-output-viewer/types';

describe('hintsTreeUtils.buildTreeFromHints — primitive arrays', () => {
  it('expands a primitive array hint into per-item insertable nodes', () => {
    const hints: OutputDisplayHints = {
      hero: [],
      secondary: [
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

    const tree = hintsTreeUtils.buildTreeFromHints({
      stepName: 'step_1',
      displayName: 'Gmail',
      hints,
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
    const hints: OutputDisplayHints = {
      hero: [{ key: 'tags', value: 'tags' }],
    };

    const tree = hintsTreeUtils.buildTreeFromHints({
      stepName: 'step_1',
      displayName: 'Step',
      hints,
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
    const hints: OutputDisplayHints = {
      hero: [
        {
          key: 'attachments',
          value: 'attachments',
          listItems: [{ key: 'fileName' }, { key: 'size', format: 'filesize' }],
        },
      ],
    };

    const tree = hintsTreeUtils.buildTreeFromHints({
      stepName: 'step_1',
      displayName: 'Step',
      hints,
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
    const hints: OutputDisplayHints = {
      hero: [{ key: 'rows', value: 'rows' }],
    };

    const tree = hintsTreeUtils.buildTreeFromHints({
      stepName: 'step_1',
      displayName: 'Step',
      hints,
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
