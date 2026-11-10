/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PieceSelectorTabs } from '@/features/pieces/components/piece-selector-tabs';
import {
  PieceSelectorTabsProvider,
  PieceSelectorTabType,
} from '@/features/pieces/stores/piece-selector-tabs-provider';

describe('piece selector tabs', () => {
  it('sizes each tab to its name between 85px and 160px instead of a fixed 85px', () => {
    render(
      <PieceSelectorTabsProvider
        initiallySelectedTab={PieceSelectorTabType.EXPLORE}
        onTabChange={() => {}}
      >
        <PieceSelectorTabs
          tabs={[
            {
              key: PieceSelectorTabType.AI_AND_AGENTS,
              type: PieceSelectorTabType.AI_AND_AGENTS,
              name: 'AI & Agents',
              icon: null,
            },
            {
              key: PieceSelectorTabType.APPROVALS,
              type: PieceSelectorTabType.APPROVALS,
              name: 'Approvals',
              icon: null,
            },
          ]}
        />
      </PieceSelectorTabsProvider>,
    );

    for (const { classList } of screen.getAllByRole('tab')) {
      expect(classList.contains('min-w-[85px]')).toBe(true);
      expect(classList.contains('max-w-[160px]')).toBe(true);
      expect([...classList].some((name) => name.startsWith('w-['))).toBe(false);
    }
  });
});
