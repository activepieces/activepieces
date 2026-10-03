/**
 * @vitest-environment jsdom
 */
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useProjectsUsage } = vi.hoisted(() => ({ useProjectsUsage: vi.fn() }));

vi.mock('@/features/billing', () => ({
  billingQueries: { useProjectsUsage },
}));

vi.mock('@/features/projects', () => ({
  projectCollectionUtils: { setCurrentProject: vi.fn() },
}));

vi.mock('@/components/custom/data-table', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  DataTable: () => null,
}));

vi.mock('@/components/custom/date-time-picker-range', () => ({
  DateTimePickerWithRange: () => null,
}));

import { ProjectsUsageTable } from '@/features/billing/components/feature-usage/projects-usage-table';

function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <ProjectsUsageTable platformId="platform-1" />
    </MemoryRouter>,
  );
  return useProjectsUsage.mock.lastCall?.[1];
}

beforeEach(() => {
  useProjectsUsage.mockReset();
  useProjectsUsage.mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
  });
});

describe('credits usage by project table', () => {
  it('asks for as many projects as the rows-per-page selector shows', () => {
    expect(renderAt('/?limit=30')).toMatchObject({ limit: 30 });
  });

  it('keeps the cursor alongside the page size when paging at 10 rows', () => {
    expect(renderAt('/?limit=10&cursor=abc')).toMatchObject({
      limit: 10,
      cursor: 'abc',
    });
  });

  it('leaves the page size to the server when no limit is in the url', () => {
    expect(renderAt('/').limit).toBeUndefined();
  });
});
