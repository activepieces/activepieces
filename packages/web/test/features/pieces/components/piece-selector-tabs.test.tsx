// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PieceSelectorTabs } from '@/features/pieces/components/piece-selector-tabs';
import { PieceSelectorTabType } from '@/features/pieces/stores/piece-selector-tabs-provider';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' }, t: (k: string) => k }),
}));

vi.mock('@/features/pieces/stores/piece-selector-tabs-provider', () => ({
  PieceSelectorTabType: {
    ALL: 'ALL',
    CORE: 'CORE',
    APP: 'APP',
    CUSTOM: 'CUSTOM',
  },
  usePieceSelectorTabs: () => ({
    selectedTab: 'ALL',
    selectedCustomTabId: null,
    setSelectedTab: vi.fn(),
  }),
}));

describe('PieceSelectorTabs', () => {
  it('renders tab list and names with tooltip wrapping', () => {
    const mockTabs = [
      {
        key: 'ALL',
        type: PieceSelectorTabType.ALL as any,
        name: 'All',
        icon: <svg data-testid="icon-all" />,
      },
      {
        key: 'APPROVALS',
        type: PieceSelectorTabType.CORE as any,
        name: 'Approvals',
        icon: <svg data-testid="icon-approvals" />,
      },
      {
        key: 'AI_AND_AGENTS',
        type: PieceSelectorTabType.CORE as any,
        name: 'AI & Agents',
        icon: <svg data-testid="icon-ai" />,
      },
    ];

    render(<PieceSelectorTabs tabs={mockTabs} />);

    expect(screen.getByText('All')).toBeDefined();
    expect(screen.getByText('Approvals')).toBeDefined();
    expect(screen.getByText('AI & Agents')).toBeDefined();
  });
});
