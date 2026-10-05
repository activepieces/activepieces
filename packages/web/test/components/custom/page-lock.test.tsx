/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { hidePageHeader: false } }),
}));

import {
  Page,
  PAGE_LOCK_HEADER,
  PageHeader,
  PageLock,
} from '@/components/custom/page';

function WrappedHeader() {
  return <PageHeader title="Wrapped title" />;
}
Object.assign(WrappedHeader, { [PAGE_LOCK_HEADER]: true });

const renderLocked = (header: React.ReactNode) =>
  render(
    <PageLock
      callout={({ underPageTitle }) => (
        <div data-testid="callout">
          {underPageTitle ? 'under title' : 'standalone'}
        </div>
      )}
    >
      <Page>
        {header}
        <button type="button">Row action</button>
      </Page>
    </PageLock>,
  );

afterEach(() => {
  document.body.innerHTML = '';
});

describe('PageLock', () => {
  it('puts the callout under a plain PageHeader and keeps the title live', () => {
    renderLocked(<PageHeader title="Plain title" />);
    expect(screen.getAllByTestId('callout')).toHaveLength(1);
    expect(screen.getByText('under title')).toBeDefined();
    expect(screen.queryByText('standalone')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Plain title' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Row action' })).toBeNull();
  });

  it('treats a component marked as the page header the same way', () => {
    renderLocked(<WrappedHeader />);
    expect(screen.getAllByTestId('callout')).toHaveLength(1);
    expect(screen.getByText('under title')).toBeDefined();
    expect(screen.queryByText('standalone')).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Wrapped title' }),
    ).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Row action' })).toBeNull();
  });
});
