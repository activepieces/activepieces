/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminPageHeader } from '@/app/components/admin';

const state = vi.hoisted(() => ({ hidePageHeader: false }));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({
    embedState: { isEmbedded: true, hidePageHeader: state.hidePageHeader },
  }),
}));

function renderHeader() {
  render(
    <AdminPageHeader title="Users" description="Manage users">
      <button type="button">Invite</button>
    </AdminPageHeader>,
  );
}

beforeEach(() => {
  state.hidePageHeader = false;
});

afterEach(cleanup);

describe('AdminPageHeader', () => {
  it('shows the title and page actions', () => {
    renderHeader();

    expect(screen.getByRole('heading', { name: 'Users' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Invite' })).toBeDefined();
  });

  it('keeps page actions when an embedding hides the page header', () => {
    state.hidePageHeader = true;

    renderHeader();

    expect(screen.queryByRole('heading', { name: 'Users' })).toBeNull();
    expect(screen.queryByText('Manage users')).toBeNull();
    expect(screen.getByRole('button', { name: 'Invite' })).toBeDefined();
  });
});
