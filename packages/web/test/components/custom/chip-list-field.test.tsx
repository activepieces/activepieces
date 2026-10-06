/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-text-content, testing-library/no-node-access -- @testing-library/jest-dom is not a dependency of packages/web */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

import {
  ChipListField,
  splitChipEntries,
} from '@/components/custom/settings-parts';
import { AdminControl } from '@/lib/admin-control';

afterEach(() => {
  document.body.innerHTML = '';
});

const mount = ({
  values = [],
  onAdd = vi.fn(),
  validate,
}: {
  values?: string[];
  onAdd?: (value: string) => Promise<unknown> | void;
  validate?: (value: string) => string | null;
}) =>
  render(
    <ChipListField
      values={values}
      onAdd={onAdd}
      onRemove={vi.fn()}
      placeholder="domain"
      emptyLabel="empty"
      validate={validate}
      submitControl={AdminControl.SSO_ALLOWED_DOMAINS_SUBMIT}
    />,
  );

const input = () => screen.getByPlaceholderText('domain') as HTMLInputElement;

describe('splitChipEntries', () => {
  it('splits on commas, spaces and new lines and drops repeats', () => {
    expect(splitChipEntries(' a.com, b.com\nc.com  a.com,,')).toEqual([
      'a.com',
      'b.com',
      'c.com',
    ]);
  });
});

describe('ChipListField', () => {
  it('adds every entry of a separated list, skipping ones already listed', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    mount({ values: ['b.com'], onAdd });
    fireEvent.change(input(), { target: { value: 'a.com, b.com c.com' } });
    fireEvent.submit(input().closest('form') as HTMLFormElement);
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(2));
    expect(onAdd.mock.calls.map(([value]) => value)).toEqual([
      'a.com',
      'c.com',
    ]);
    await waitFor(() => expect(input().value).toBe(''));
  });

  it('adds nothing and names the bad entry when one entry is invalid', () => {
    const onAdd = vi.fn();
    mount({
      onAdd,
      validate: (value) => (value.includes('.') ? null : 'bad'),
    });
    fireEvent.change(input(), { target: { value: 'a.com nope' } });
    fireEvent.submit(input().closest('form') as HTMLFormElement);
    expect(onAdd).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('nope');
  });

  it('turns a pasted multi-line list into one separated draft', () => {
    mount({});
    fireEvent.paste(input(), {
      clipboardData: { getData: () => 'a.com\nb.com\r\nc.com' },
    });
    expect(input().value).toBe('a.com, b.com, c.com');
  });

  it('reports the submit control only on the add button', () => {
    mount({ values: ['a.com'] });
    const tagged = document.querySelectorAll(
      `[data-ap-control="${AdminControl.SSO_ALLOWED_DOMAINS_SUBMIT}"]`,
    );
    expect(tagged).toHaveLength(1);
    expect(tagged[0].textContent).toContain('Add');
  });
});
