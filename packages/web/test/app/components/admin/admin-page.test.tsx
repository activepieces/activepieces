/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { hidePageHeader: false } }),
}));

import { AdminPage, AdminPageHeader } from '@/app/components/admin';
import { AdminPageLockContext } from '@/app/components/admin/admin-page-lock';

const page = (
  <AdminPage>
    <AdminPageHeader title="Audit Logs">
      <button>New export</button>
    </AdminPageHeader>
    <button>Open sample row</button>
  </AdminPage>
);

describe('locked admin page', () => {
  it('keeps the title, hides header actions and shows the callout over an inert preview', () => {
    const claim = vi.fn();
    render(
      <MemoryRouter>
        <AdminPageLockContext.Provider
          value={{ callout: <p>locked callout</p>, claim }}
        >
          {page}
        </AdminPageLockContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Audit Logs' })).toBeDefined();
    expect(screen.getByText('locked callout')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'New export' })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Open sample row' }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Open sample row', hidden: true }),
    ).toBeDefined();
    expect(claim).toHaveBeenCalled();
  });

  it('renders the page as usual when nothing is locked', () => {
    render(<MemoryRouter>{page}</MemoryRouter>);

    expect(screen.getByRole('button', { name: 'New export' })).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Open sample row' }),
    ).toBeDefined();
  });
});
