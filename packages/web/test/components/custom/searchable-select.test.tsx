/**
 * @vitest-environment jsdom
 */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { SearchableSelect } from '@/components/custom/searchable-select';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

Element.prototype.scrollIntoView = () => undefined;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as never;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const bodyText = () => document.body.textContent ?? '';

describe('SearchableSelect label resolution', () => {
  let root: Root | undefined;

  afterEach(() => {
    act(() => root?.unmount());
    document.body.innerHTML = '';
  });

  const mount = (props: {
    options: { label: string; value: string }[];
    cachedOptions: { label: string; value: string }[];
    value: string;
  }) => {
    act(() => {
      root = createRoot(document.body);
      root.render(
        <SearchableSelect
          options={props.options}
          cachedOptions={props.cachedOptions}
          value={props.value}
          onChange={() => undefined}
          placeholder="Select an option"
          disabled={false}
        />,
      );
    });
  };

  it('prefers the current option list when both lists carry the value', () => {
    mount({
      options: [{ label: 'Invoices', value: '5' }],
      cachedOptions: [{ label: 'Orders', value: '5' }],
      value: '5',
    });

    expect(bodyText()).toContain('Invoices');
    expect(bodyText()).not.toContain('Orders');
  });

  it('falls back to the cached list when the current one lacks the value', () => {
    mount({
      options: [{ label: 'Invoices', value: '9' }],
      cachedOptions: [{ label: 'Orders', value: '5' }],
      value: '5',
    });

    expect(bodyText()).toContain('Orders');
  });
});
