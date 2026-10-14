/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';

import { PieceSelectorTabType } from '@/features/pieces/stores/piece-selector-tabs-provider';
import { pieceSelectorCustomization } from '@/features/pieces/utils/piece-selector-customization';

const utility = {
  value: PieceSelectorTabType.UTILITY,
  name: 'Utility',
  icon: null,
};

const resolvedName = (title: string | undefined) =>
  pieceSelectorCustomization.buildResolvedTabs({
    availableBuiltinTabs: [utility],
    config: {
      tabs: [
        {
          id: 'tab_utility',
          kind: 'BUILTIN',
          builtinTab: 'UTILITY',
          title,
          hidden: false,
        },
      ],
    },
  })[0]?.name;

describe('pieceSelectorCustomization.buildResolvedTabs', () => {
  it('uses the built-in name when a built-in tab has no name of its own', () => {
    expect(resolvedName(undefined)).toBe('Utility');
  });

  it('falls back to the built-in name when the name was cleared', () => {
    expect(resolvedName('')).toBe('Utility');
    expect(resolvedName('   ')).toBe('Utility');
  });

  it('keeps a name the admin typed', () => {
    expect(resolvedName('Helpers')).toBe('Helpers');
  });
});
