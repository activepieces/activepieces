/**
 * @vitest-environment jsdom
 */
import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DialogContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogFooter: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/components/custom/markdown', () => ({
  ApMarkdown: () => <div />,
}));

vi.mock('@/components/custom/clipboard/copy-to-clipboard', () => ({
  CopyToClipboardInput: () => <div />,
}));

vi.mock('@/features/platform-admin', () => ({
  samlSsoApi: {
    updateSsoDomain: vi.fn(),
    verifySsoDomain: vi.fn(),
  },
}));

vi.mock('@/api/platforms-api', () => ({
  platformApi: { update: vi.fn() },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    queryKey: ['flags'],
    useFlag: () => ({ data: null }),
  },
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform-1',
        emailAuthEnabled: true,
        googleAuthEnabled: true,
        federatedAuthProviders: { saml: null },
      },
    }),
  },
}));

import { ConfigureSamlDialog } from '@/app/routes/platform/security/sso/saml-dialog';

const FORM_MESSAGE = '[data-slot="form-message"]';

let container: HTMLDivElement;
let root: Root;

async function renderDialog() {
  const platform = {
    id: 'platform-1',
    ssoDomain: null,
    ssoDomainVerification: null,
    emailAuthEnabled: true,
    googleAuthEnabled: true,
    federatedAuthProviders: { saml: null },
  } as unknown as PlatformWithoutSensitiveData;
  await act(async () => {
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <ConfigureSamlDialog
          platform={platform}
          connected={false}
          refetch={async () => undefined}
        />
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    openTrigger().click();
  });
}

function openTrigger(): HTMLButtonElement {
  const trigger = Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent === 'Enable',
  );
  if (!trigger) {
    throw new Error('Enable trigger not found');
  }
  return trigger;
}

function domainInput(): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('#ssoDomain');
  if (!input) {
    throw new Error('ssoDomain input not found');
  }
  return input;
}

function saveButton(): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent === 'Save domain',
  );
}

async function typeCharByChar(value: string) {
  const setValue = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;
  for (let length = 1; length <= value.length; length++) {
    const input = domainInput();
    await act(async () => {
      setValue?.call(input, value.slice(0, length));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
}

async function blurInput() {
  await act(async () => {
    domainInput().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  });
}

describe('SAML SSO domain field defers its error message', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it('stays quiet while a partial domain is being typed', async () => {
    await renderDialog();

    await typeCharByChar('acme');

    expect(container.querySelector(FORM_MESSAGE)).toBeNull();
  });

  it('shows the error once the user leaves the field', async () => {
    await renderDialog();

    await typeCharByChar('acme');
    await blurInput();

    expect(container.querySelector(FORM_MESSAGE)?.textContent).toBe(
      'invalidSsoDomain',
    );
  });

  it('clears the error and enables saving once the domain is valid', async () => {
    await renderDialog();

    await typeCharByChar('acme');
    await blurInput();
    await typeCharByChar('acme.com');

    expect(container.querySelector(FORM_MESSAGE)).toBeNull();
    expect(saveButton()?.disabled).toBe(false);
  });
});
