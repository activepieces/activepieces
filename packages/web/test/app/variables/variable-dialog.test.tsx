/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('lucide-react', () => ({
  Eye: () => null,
  EyeOff: () => null,
  Paperclip: () => null,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

vi.mock('@/components/ui/sonner', () => ({ internalErrorToast: vi.fn() }));

vi.mock('@/features/variables/api/variables', () => ({ variablesApi: {} }));

vi.mock('@/lib/api', () => ({ api: { isApError: () => false } }));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'test-project' },
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogDescription: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogFooter: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogClose: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    asChild: _asChild,
    variant: _variant,
    size: _size,
    loading: _loading,
    ...props
  }: React.ComponentProps<'button'> & {
    asChild?: boolean;
    variant?: string;
    size?: string;
    loading?: boolean;
  }) => <button {...props}>{children}</button>,
}));

import { VariableDialog } from '@/app/variables/variable-dialog';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const MASK_CLASS = '[-webkit-text-security:disc]';

let container: HTMLDivElement | undefined;
let root: Root | undefined;

function setup() {
  container = document.createElement('div');
  document.body.appendChild(container);
  const newRoot = createRoot(container);
  root = newRoot;
  act(() => {
    newRoot.render(
      <QueryClientProvider client={new QueryClient()}>
        <VariableDialog open={true} onOpenChange={() => {}} />
      </QueryClientProvider>,
    );
  });
}

function valueInput(): HTMLInputElement {
  const input = container?.querySelector<HTMLInputElement>(
    'input[name="value"]',
  );
  if (!input) {
    throw new Error('value input not found');
  }
  return input;
}

function clickEyeToggle() {
  const toggle = Array.from(container?.querySelectorAll('button') ?? []).find(
    (b) =>
      ['Show value', 'Hide value'].includes(b.getAttribute('aria-label') ?? ''),
  );
  if (!toggle) {
    throw new Error('eye toggle not found');
  }
  act(() => {
    toggle.click();
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe('VariableDialog value field', () => {
  it('masks the value with CSS instead of a password input', () => {
    setup();
    const input = valueInput();
    expect(input.type).toBe('text');
    expect(input.className).toContain(MASK_CLASS);
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(input.getAttribute('spellcheck')).toBe('false');
  });

  it('reveals the value on eye toggle and re-masks on toggle back', () => {
    setup();
    clickEyeToggle();
    expect(valueInput().type).toBe('text');
    expect(valueInput().className).not.toContain(MASK_CLASS);
    clickEyeToggle();
    expect(valueInput().className).toContain(MASK_CLASS);
  });
});
