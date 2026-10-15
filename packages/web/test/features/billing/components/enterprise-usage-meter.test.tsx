/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-container, testing-library/no-node-access -- the bar is a decorative span with no role */
import { render } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { EnterpriseUsageMeter } from '@/features/billing/components/enterprise-usage-meter';
import { EnterpriseGate } from '@/features/billing/hooks/use-enterprise-gate';

const gate: EnterpriseGate = {
  access: 'ask_admin',
  locked: true,
  run: vi.fn(),
  explain: vi.fn(),
};

function barClass({ used, limit }: { used: number; limit: number }) {
  const { container } = render(
    <EnterpriseUsageMeter
      gate={gate}
      used={used}
      limit={limit}
      label="users"
    />,
  );
  return container.querySelector('[aria-hidden] > span')?.className ?? '';
}

describe('EnterpriseUsageMeter bar tone', () => {
  it('is red when every seat is used, like the Usage page card', () => {
    expect(barClass({ used: 5, limit: 5 })).toContain('bg-danger-9');
  });

  it('is amber when seats are running low', () => {
    expect(barClass({ used: 3, limit: 4 })).toContain('bg-warning-9');
  });

  it('keeps the accent colour with plenty of room', () => {
    expect(barClass({ used: 1, limit: 5 })).toContain('bg-accent-9');
  });
});
