/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

const mounts = vi.fn();

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({
    embedState: { isEmbedded: false, hidePageHeader: false },
  }),
}));

vi.mock('@/features/billing', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useEnterpriseGate: () => ({
    access: 'upgrade',
    locked: true,
    run: vi.fn(),
    explain: vi.fn(),
  }),
  EnterpriseLockedCard: () => <div role="status">locked card</div>,
}));

import { AdminPage, AdminPageHeader } from '@/app/components/admin/admin-page';
import { EnterpriseGate } from '@/app/components/enterprise-gate';

function PageBody() {
  React.useEffect(() => {
    mounts();
  }, []);
  return <p>page body</p>;
}

describe('locked page preview', () => {
  it('mounts the page once when the page claims the lock', () => {
    render(
      <EnterpriseGate mode="preview" unlocked={false} featureKey="AUDIT_LOGS">
        <AdminPage>
          <AdminPageHeader title="Audit logs" />
          <PageBody />
        </AdminPage>
      </EnterpriseGate>,
    );
    expect(mounts).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Audit logs' })).toBeDefined();
  });
});
