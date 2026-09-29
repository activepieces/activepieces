import { t } from 'i18next';

import {
  ToolCategory,
  ToolMeta,
} from '@/app/components/project-settings/mcp-server/utils/mcp-tools-metadata';

const DRAFT_TOOLS = new Set([
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
]);

const DELETE_TOOLS = new Set([
  'ap_delete_flow',
  'ap_delete_table',
  'ap_delete_records',
  'ap_manage_fields',
]);

function tierOf({
  name,
  locked,
}: {
  name: string;
  locked: boolean;
}): McpToolTier {
  if (locked) {
    return 'read';
  }
  if (DELETE_TOOLS.has(name)) {
    return 'delete';
  }
  return DRAFT_TOOLS.has(name) ? 'draft' : 'live';
}

function groupByTier(categories: ToolCategory[]): McpToolTierGroup[] {
  const buckets: Record<McpToolTier, ToolMeta[]> = {
    read: [],
    draft: [],
    live: [],
    delete: [],
  };
  for (const category of categories) {
    for (const tool of category.tools) {
      buckets[
        tierOf({ name: tool.name, locked: category.locked === true })
      ].push(tool);
    }
  }
  return TIER_ORDER.map((id) => ({
    id,
    locked: id === 'read',
    tools: buckets[id],
  })).filter((group) => group.tools.length > 0);
}

function countEnabled({
  group,
  disabledTools,
}: {
  group: McpToolTierGroup;
  disabledTools: string[];
}): number {
  if (group.locked) {
    return group.tools.length;
  }
  return group.tools.filter((tool) => !disabledTools.includes(tool.name))
    .length;
}

function copyOf(tier: McpToolTier): McpToolTierCopy {
  switch (tier) {
    case 'read':
      return {
        label: t('View'),
        description: t('View flows, runs, tables, connections and pieces.'),
      };
    case 'draft':
      return {
        label: t('Edit flows'),
        description: t('Create, rename and duplicate flows, and edit drafts.'),
      };
    case 'live':
      return {
        label: t('Publish and run'),
        description: t(
          'Publish, test and run flows and actions, and change tables.',
        ),
      };
    case 'delete':
      return {
        label: t('Delete'),
        description: t('Permanently delete flows, tables, fields and records.'),
      };
  }
}

function titleOf(toolName: string): string {
  const words = toolName.replace(/^ap_/, '').split('_').join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const TIER_ORDER: McpToolTier[] = ['read', 'draft', 'live', 'delete'];

export const mcpToolTiers = {
  groupByTier,
  countEnabled,
  copyOf,
  titleOf,
};

export type McpToolTier = 'read' | 'draft' | 'live' | 'delete';

export type McpToolTierGroup = {
  id: McpToolTier;
  locked: boolean;
  tools: ToolMeta[];
};

type McpToolTierCopy = {
  label: string;
  description: string;
};
