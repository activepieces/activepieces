import { describe, expect, it } from 'vitest';

import { getToolCategories } from '@/app/components/project-settings/mcp-server/utils/mcp-tools-metadata';

const toolNames = (categories: ReturnType<typeof getToolCategories>) =>
  categories.flatMap((category) => category.tools.map((tool) => tool.name));

describe('getToolCategories', () => {
  it('includes the tool-search pair in the locked Discovery category when the flag is on', () => {
    const categories = getToolCategories({ toolSearchEnabled: true });
    const discovery = categories.find((c) => c.label === 'Discovery');

    expect(discovery?.locked).toBe(true);
    expect(discovery?.tools.map((t) => t.name)).toEqual(
      expect.arrayContaining(['ap_search_actions', 'ap_search_triggers']),
    );
  });

  it('omits the tool-search pair when the flag is off', () => {
    const names = toolNames(getToolCategories({ toolSearchEnabled: false }));

    expect(names).not.toContain('ap_search_actions');
    expect(names).not.toContain('ap_search_triggers');
  });

  it('only differs by the tool-search pair between flag states', () => {
    const withFlag = toolNames(getToolCategories({ toolSearchEnabled: true }));
    const withoutFlag = toolNames(
      getToolCategories({ toolSearchEnabled: false }),
    );

    expect(withFlag.filter((name) => !withoutFlag.includes(name))).toEqual([
      'ap_search_actions',
      'ap_search_triggers',
    ]);
  });

  it('shows the platform admin tools only on the platform page', () => {
    const adminTools = ['ap_platform_read', 'ap_platform_write'];

    expect(
      toolNames(
        getToolCategories({ toolSearchEnabled: true, scope: 'platform' }),
      ),
    ).toEqual(expect.arrayContaining(adminTools));
    expect(
      toolNames(getToolCategories({ toolSearchEnabled: true })),
    ).not.toEqual(expect.arrayContaining(['ap_platform_read']));
  });
});
