import { describe, expect, it } from 'vitest';

import { mcpToolTiers } from '@/app/components/project-settings/mcp-server/tool-tiers/mcp-tool-tiers';
import { getToolCategories } from '@/app/components/project-settings/mcp-server/utils/mcp-tools-metadata';

function namesIn({ tier }: { tier: string }): string[] {
  const group = mcpToolTiers
    .groupByTier(getToolCategories({ toolSearchEnabled: true }))
    .find((g) => g.id === tier);
  return group?.tools.map((tool) => tool.name) ?? [];
}

describe('mcpToolTiers.groupByTier', () => {
  it('puts every tool in exactly one tier', () => {
    const categories = getToolCategories({ toolSearchEnabled: true });
    const all = categories.flatMap((c) => c.tools.map((tool) => tool.name));
    const grouped = mcpToolTiers
      .groupByTier(categories)
      .flatMap((g) => g.tools.map((tool) => tool.name));
    expect(grouped.sort()).toEqual([...all].sort());
  });

  it('makes the locked category the always-on read tier', () => {
    const tiers = mcpToolTiers.groupByTier(
      getToolCategories({ toolSearchEnabled: true }),
    );
    expect(tiers[0]).toMatchObject({ id: 'read', locked: true });
    expect(namesIn({ tier: 'read' })).toContain('ap_list_flows');
  });

  it('separates destroying things from editing drafts', () => {
    expect(namesIn({ tier: 'delete' }).sort()).toEqual([
      'ap_delete_flow',
      'ap_delete_records',
      'ap_delete_table',
      'ap_manage_fields',
    ]);
    expect(namesIn({ tier: 'draft' }).sort()).toEqual(
      [
        'ap_create_flow',
        'ap_duplicate_flow',
        'ap_rename_flow',
        'ap_build_flow',
        'ap_update_trigger',
        'ap_add_step',
        'ap_update_step',
        'ap_delete_step',
        'ap_add_branch',
        'ap_update_branch',
        'ap_delete_branch',
        'ap_manage_notes',
      ].sort(),
    );
  });

  it('treats testing and table writes as live', () => {
    const live = namesIn({ tier: 'live' });
    expect(live).toEqual(
      expect.arrayContaining([
        'ap_test_step',
        'ap_insert_records',
        'ap_lock_and_publish',
      ]),
    );
  });

  it('puts a tool it does not know in the live tier', () => {
    const tiers = mcpToolTiers.groupByTier([
      { label: 'New', tools: [{ name: 'ap_brand_new', description: '' }] },
    ]);
    expect(tiers).toEqual([
      {
        id: 'live',
        locked: false,
        tools: [{ name: 'ap_brand_new', description: '' }],
      },
    ]);
  });
});

describe('mcpToolTiers.countEnabled', () => {
  it('counts a locked tier as fully on', () => {
    const group = {
      id: 'read' as const,
      locked: true,
      tools: [{ name: 'ap_list_flows', description: '' }],
    };
    expect(
      mcpToolTiers.countEnabled({ group, disabledTools: ['ap_list_flows'] }),
    ).toBe(1);
  });

  it('subtracts disabled tools from an unlocked tier', () => {
    const group = {
      id: 'delete' as const,
      locked: false,
      tools: [
        { name: 'ap_delete_flow', description: '' },
        { name: 'ap_delete_table', description: '' },
      ],
    };
    expect(
      mcpToolTiers.countEnabled({ group, disabledTools: ['ap_delete_flow'] }),
    ).toBe(1);
  });
});

describe('mcpToolTiers.titleOf', () => {
  it('turns a tool name into a sentence-case title', () => {
    expect(mcpToolTiers.titleOf('ap_change_flow_status')).toBe(
      'Change flow status',
    );
    expect(mcpToolTiers.titleOf('ap_lock_and_publish')).toBe(
      'Lock and publish',
    );
  });
});
