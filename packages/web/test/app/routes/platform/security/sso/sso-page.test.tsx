/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { SsoDomainVerificationStatus } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  toastMock,
  platformApiMock,
  samlSsoApiMock,
  platformState,
  refetchMock,
} = vi.hoisted(() => {
  const state: { current: Record<string, unknown> } = { current: {} };
  return {
    toastMock: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
    platformApiMock: { update: vi.fn() },
    samlSsoApiMock: {
      discover: vi.fn(),
      updateSsoDomain: vi.fn(),
      verifySsoDomain: vi.fn(),
    },
    platformState: state,
    refetchMock: vi.fn(async () => undefined),
  };
});

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string>) =>
    Object.entries(values ?? {}).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, value),
      key,
    ),
}));

vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('@/lib/api', () => ({
  api: {
    extractServerErrorMessage: (error: unknown, fallback: string) =>
      error instanceof Error ? error.message : fallback,
  },
}));

vi.mock('@/api/platforms-api', () => ({ platformApi: platformApiMock }));

vi.mock('@/features/platform-admin/api/saml-sso-api', () => ({
  samlSsoApi: samlSsoApiMock,
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: platformState.current,
      refetch: refetchMock,
    }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: 'https://cloud.test/acs' }) },
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => (
    <>{children}</>
  ),
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuItem: ({
    children,
    onSelect,
    disabled,
  }: React.PropsWithChildren<{
    onSelect?: (event: { preventDefault: () => void }) => void;
    disabled?: boolean;
    variant?: string;
  }>) => (
    <div
      role="menuitem"
      aria-disabled={disabled}
      onClick={() => onSelect?.({ preventDefault: () => undefined })}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/dialog', async () => {
  const { createContext, useContext } = await import('react');
  const DialogContext = createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }>({ open: false, onOpenChange: () => undefined });
  return {
    Dialog: ({
      children,
      open,
      onOpenChange,
    }: React.PropsWithChildren<{
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }>) => (
      <DialogContext.Provider value={{ open, onOpenChange }}>
        {children}
      </DialogContext.Provider>
    ),
    DialogTrigger: ({ children }: React.PropsWithChildren) => {
      const { onOpenChange } = useContext(DialogContext);
      return <span onClick={() => onOpenChange(true)}>{children}</span>;
    },
    DialogContent: ({ children }: React.PropsWithChildren) => {
      const { open } = useContext(DialogContext);
      return open ? <div role="dialog">{children}</div> : null;
    },
    DialogHeader: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
    DialogTitle: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
    DialogDescription: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
    DialogFooter: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
  };
});

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
  }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

import { SSOPage } from '@/app/routes/platform/security/sso';
import { SamlSetupPage } from '@/app/routes/platform/security/sso/saml-setup-page';

const pendingVerification = {
  status: SsoDomainVerificationStatus.PENDING_VERIFICATION,
  record: { type: 'TXT', name: '_activepieces.acme.com', value: 'ap-verify=1' },
  createdAt: '2026-10-14T00:00:00.000Z',
};

const verifiedVerification = {
  ...pendingVerification,
  status: SsoDomainVerificationStatus.VERIFIED,
};

const samlConfig = { idpMetadata: '<xml />', idpCertificate: 'cert' };

describe('SSOPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformApiMock.update.mockResolvedValue(undefined);
    samlSsoApiMock.updateSsoDomain.mockResolvedValue({
      ssoDomain: null,
      ssoDomainVerification: null,
    });
    setPlatform({});
  });

  it('shows the empty states when nothing is set up', () => {
    mount();

    expect(screen.getByText('Authentication')).toBeDefined();
    expect(screen.getByText('No domains yet')).toBeDefined();
    expect(screen.getByText('No allowed domains')).toBeDefined();
    expect(findButton('Set up')).toBeDefined();
    expect(screen.queryByText('Connected')).toBeNull();
  });

  it('shows a pending domain and checks DNS again from its menu', async () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: pendingVerification,
    });
    samlSsoApiMock.verifySsoDomain.mockResolvedValue({
      ssoDomain: 'acme.com',
      ssoDomainVerification: pendingVerification,
    });
    mount();

    expect(screen.getByText('acme.com')).toBeDefined();
    expect(screen.getByText('Pending DNS')).toBeDefined();
    click(menuItem('Check DNS again'));

    await waitFor(() =>
      expect(samlSsoApiMock.verifySsoDomain).toHaveBeenCalledTimes(1),
    );
    await waitFor(() =>
      expect(toastMock.message).toHaveBeenCalledWith(
        'TXT record not found yet — DNS can take a few minutes.',
      ),
    );
  });

  it('shows a verified domain without the DNS check', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
    });
    mount();

    expect(screen.getByText('Verified')).toBeDefined();
    expect(screen.queryByText('Check DNS again')).toBeNull();
  });

  it('shows the TXT record from the domain menu', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
    });
    mount();

    click(menuItem('View DNS record'));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('DNS record for acme.com')).toBeDefined();
    expect(within(dialog).getByText('TXT')).toBeDefined();
  });

  it('turns SAML off before removing the domain', async () => {
    setPlatform({
      id: 'platform-1',
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
    });
    mount();

    click(menuItem('Remove domain'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        'This deletes your SAML connection, so people who use single sign-on will have to sign in another way.',
      ),
    ).toBeDefined();
    click(findButton('Remove domain', dialog));

    await waitFor(() =>
      expect(samlSsoApiMock.updateSsoDomain).toHaveBeenCalledWith(null),
    );
    expect(platformApiMock.update).toHaveBeenCalledWith(
      { federatedAuthProviders: { saml: null } },
      'platform-1',
    );
    expect(platformApiMock.update.mock.invocationCallOrder[0]).toBeLessThan(
      samlSsoApiMock.updateSsoDomain.mock.invocationCallOrder[0],
    );
  });

  it('warns that email sign-in is off before removing a domain with SAML connected', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
      emailAuthEnabled: false,
    });
    mount();

    click(menuItem('Remove domain'));

    expect(
      within(screen.getByRole('dialog')).getByText(
        'Email sign-in is off. Turn it on first if they need it.',
      ),
    ).toBeDefined();
  });

  it('keeps the domain when turning SAML off fails', async () => {
    setPlatform({
      id: 'platform-1',
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
    });
    platformApiMock.update.mockRejectedValue(new Error('Request failed'));
    mount();

    click(menuItem('Remove domain'));
    click(findButton('Remove domain', screen.getByRole('dialog')));

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith('Request failed'),
    );
    expect(samlSsoApiMock.updateSsoDomain).not.toHaveBeenCalled();
  });

  it('removes the domain without touching SAML when SAML is not connected', async () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: pendingVerification,
    });
    mount();

    click(menuItem('Remove domain'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        "To set up single sign-on later, you'll need to add and verify a domain again.",
      ),
    ).toBeDefined();
    click(findButton('Remove domain', dialog));

    await waitFor(() =>
      expect(samlSsoApiMock.updateSsoDomain).toHaveBeenCalledWith(null),
    );
    expect(platformApiMock.update).not.toHaveBeenCalled();
  });

  it('shows a connected SAML provider as Manage', () => {
    setPlatform({ federatedAuthProviders: { saml: samlConfig } });
    mount();

    expect(screen.getByText('Connected')).toBeDefined();
    expect(findButton('Manage')).toBeDefined();
  });

  it('toggles Google and email with the same requests as before', async () => {
    setPlatform({
      id: 'platform-1',
      googleAuthEnabled: true,
      emailAuthEnabled: false,
    });
    mount();

    click(screen.getByRole('switch', { name: 'Continue with Google' }));
    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        { googleAuthEnabled: false },
        'platform-1',
      ),
    );

    click(screen.getByRole('switch', { name: 'Email and password' }));
    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        { emailAuthEnabled: true },
        'platform-1',
      ),
    );
  });

  it('removes one allowed domain and keeps the list enforced', async () => {
    setPlatform({
      id: 'platform-1',
      allowedAuthDomains: ['contractors.io', 'partners.io'],
    });
    mount();

    expect(screen.getByText('contractors.io')).toBeDefined();
    click(menuItem('Remove domain'));
    click(findButton('Remove domain', screen.getByRole('dialog')));

    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        {
          allowedAuthDomains: ['partners.io'],
          enforceAllowedAuthDomains: true,
        },
        'platform-1',
      ),
    );
  });

  it('stops enforcing the list when the last allowed domain is removed', async () => {
    setPlatform({ id: 'platform-1', allowedAuthDomains: ['contractors.io'] });
    mount();

    click(menuItem('Remove domain'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        'With no domains left, any email address can sign in with email and password.',
      ),
    ).toBeDefined();
    click(findButton('Remove domain', dialog));

    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        { allowedAuthDomains: [], enforceAllowedAuthDomains: false },
        'platform-1',
      ),
    );
  });

  it('adds the first allowed domain in one step and warns to add your company domain', async () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
    });
    mount();

    click(findButton('Add domain'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        'Once a domain is on this list, only people at listed domains can sign in with email and password. Add your company domain too.',
      ),
    ).toBeDefined();
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: ' Contractors.IO ' },
    });
    await submitWhenValid(dialog);

    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        {
          allowedAuthDomains: ['contractors.io'],
          enforceAllowedAuthDomains: true,
        },
        'platform-1',
      ),
    );
  });

  it('appends a allowed domain to the existing list', async () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      allowedAuthDomains: ['contractors.io'],
    });
    mount();

    click(findButton('Add domain'));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: 'partners.io' },
    });
    await submitWhenValid(dialog);

    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        {
          allowedAuthDomains: ['contractors.io', 'partners.io'],
          enforceAllowedAuthDomains: true,
        },
        'platform-1',
      ),
    );
  });

  it('refuses a allowed domain that is already on the list', async () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      allowedAuthDomains: ['contractors.io'],
    });
    mount();

    click(findButton('Add domain'));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: 'contractors.io' },
    });

    expect(await within(dialog).findByText('duplicateDomain')).toBeDefined();
    expect(findButton('Add domain', dialog)?.disabled).toBe(true);
  });
});

describe('SamlSetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformApiMock.update.mockResolvedValue(undefined);
    setPlatform({});
  });

  it('is opened from the sign-in methods row as a page, not a dialog', () => {
    mount();

    expect(
      screen.getByRole('link', { name: 'Set up' }).getAttribute('href'),
    ).toBe('/platform/sso/saml');
  });

  it('saves the SAML connection with the same request as before and returns to Authentication', async () => {
    setPlatform({
      id: 'platform-1',
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
    });
    mountSetupPage();

    fireEvent.change(screen.getByLabelText('IDP Metadata'), {
      target: { value: '<xml />' },
    });
    fireEvent.change(screen.getByLabelText('IDP Certificate'), {
      target: { value: 'cert' },
    });
    await waitFor(() => expect(findButton('Save')?.disabled).toBe(false));
    click(findButton('Save'));

    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        {
          federatedAuthProviders: {
            saml: { idpMetadata: '<xml />', idpCertificate: 'cert' },
          },
        },
        'platform-1',
      ),
    );
    expect(await screen.findByText('authentication page')).toBeDefined();
  });

  it('starts a connected provider on the domain step and disables it from there', async () => {
    setPlatform({
      id: 'platform-1',
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
    });
    mountSetupPage();

    expect(screen.getByLabelText('Domain')).toBeDefined();
    click(findButton('Disable'));

    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        { federatedAuthProviders: { saml: null } },
        'platform-1',
      ),
    );
    expect(await screen.findByText('authentication page')).toBeDefined();
  });

  it('keeps Next disabled until the domain is verified', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: pendingVerification,
    });
    mountSetupPage();

    expect(findButton('Next')?.disabled).toBe(true);
  });
});

async function submitWhenValid(dialog: HTMLElement) {
  await waitFor(() =>
    expect(findButton('Add domain', dialog)?.disabled).toBe(false),
  );
  click(findButton('Add domain', dialog));
}

function setPlatform(overrides: Record<string, unknown>) {
  platformState.current = {
    id: 'platform-1',
    ssoDomain: null,
    ssoDomainVerification: null,
    federatedAuthProviders: {},
    googleAuthEnabled: false,
    emailAuthEnabled: true,
    allowedAuthDomains: [],
    ...overrides,
  };
}

function mount() {
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <SSOPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function mountSetupPage() {
  render(
    <MemoryRouter initialEntries={['/platform/sso/saml']}>
      <QueryClientProvider client={new QueryClient()}>
        <Routes>
          <Route
            path="/platform/sso"
            element={<div>authentication page</div>}
          />
          <Route path="/platform/sso/saml" element={<SamlSetupPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function click(element: Element | null | undefined) {
  if (!element) {
    throw new Error('element not found');
  }
  fireEvent.click(element);
}

function menuItem(text: string) {
  return screen
    .getAllByRole('menuitem')
    .find((item) => item.textContent === text);
}

function findButton(text: string, scope: ParentNode = document.body) {
  return Array.from(scope.querySelectorAll('button')).find(
    (button) => button.textContent === text,
  );
}
