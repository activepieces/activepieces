// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string, vars?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, name) => vars?.[name] ?? match),
}));

import { AdminFetchErrorState } from '@/app/components/admin/admin-query-state';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';

describe('failed-load copy', () => {
  it('keeps the shared copy outside admin pages', () => {
    render(<DataFetchErrorState entity="runs" />);
    expect(
      screen.getByText(
        'Nothing has been lost — your data is safe. Try again in a moment.',
      ),
    ).toBeTruthy();
  });

  it('uses the shorter copy on admin pages', () => {
    render(<AdminFetchErrorState entity="users" />);
    expect(
      screen.getByText('Your data is safe. Try again in a moment.'),
    ).toBeTruthy();
    expect(
      screen.queryByText(
        'Nothing has been lost — your data is safe. Try again in a moment.',
      ),
    ).toBeNull();
  });
});
