/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PieceSelectorTabs } from '@/features/pieces/components/piece-selector-tabs';
import {
  PieceSelectorTabsProvider,
  PieceSelectorTabType,
} from '@/features/pieces/stores/piece-selector-tabs-provider';
import { ResolvedPieceSelectorTab } from '@/features/pieces/utils/piece-selector-customization';

function renderTabs(tabs: ResolvedPieceSelectorTab[]) {
  return render(
    <PieceSelectorTabsProvider
      initiallySelectedTab={PieceSelectorTabType.EXPLORE}
      onTabChange={() => {}}
    >
      <PieceSelectorTabs tabs={tabs} />
    </PieceSelectorTabsProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('piece selector tabs', () => {
  it('sizes each tab to its name between 85px and 160px instead of a fixed 85px', () => {
    renderTabs([
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
    ]);

    for (const { classList } of screen.getAllByRole('tab')) {
      expect(classList.contains('min-w-[85px]')).toBe(true);
      expect(classList.contains('max-w-[160px]')).toBe(true);
      expect([...classList].some((name) => name.startsWith('w-['))).toBe(false);
    }
  });

  it('shows the full name of a custom tab that overflows the cap in a tooltip', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(136);
    const name = 'Customer success and support tools';
    renderTabs([
      {
        key: 'custom-1',
        type: PieceSelectorTabType.CUSTOM,
        customTabId: 'custom-1',
        name,
        icon: null,
      },
    ]);

    fireEvent.focus(screen.getByText(name));

    expect(await screen.findByRole('tooltip')).toHaveProperty(
      'textContent',
      name,
    );
  });
});
