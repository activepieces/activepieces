/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { secretManagersEnabled: false } },
    }),
  },
}));

vi.mock('@/features/secret-managers', () => ({
  secretManagersHooks: {
    useListSecretManagerConnections: () => ({ data: [] }),
  },
}));

import { SecretInput } from '@/app/connections/secret-input';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const MASK_CLASS = '[-webkit-text-security:disc]';

let container: HTMLDivElement | undefined;
let root: Root | undefined;

function mountSecretInput(type: string): HTMLInputElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  const newRoot = createRoot(container);
  root = newRoot;
  act(() => {
    newRoot.render(
      <form>
        <SecretInput name="secret" type={type} value="sk-123" />
      </form>,
    );
  });
  const input = container.querySelector<HTMLInputElement>(
    'input[name="secret"]',
  );
  if (!input) {
    throw new Error('secret input not found');
  }
  return input;
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe('SecretInput', () => {
  it('masks a password field with CSS instead of a native password input', () => {
    const input = mountSecretInput('password');
    expect(container?.querySelector('input[type="password"]')).toBeNull();
    expect(input.type).toBe('text');
    expect(input.className).toContain(MASK_CLASS);
    expect(input.autocomplete).toBe('off');
    expect(input.outerHTML).toContain('spellcheck="false"');
    expect(input.value).toBe('sk-123');
  });

  it('leaves a text field unmasked', () => {
    const input = mountSecretInput('text');
    expect(input.type).toBe('text');
    expect(input.className).not.toContain(MASK_CLASS);
    expect(input.autocomplete).toBe('');
  });
});
