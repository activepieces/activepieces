/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { SsoDomainVerificationStatus } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';

const {
  toastMock,
  platformApiMock,
  emailDomainApiMock,
  domainState,
  platformState,
  refetchMock,
  flagState,
} = vi.hoisted(() => {
  function initialFlagState(): {
    edition: string;
    thirdPartyProviders: Record<string, boolean>;
  } {
    return { edition: 'ee', thirdPartyProviders: { google: false } };
  }
  const state: { current: Record<string, unknown> } = { current: {} };
  return {
    flagState: initialFlagState(),
    toastMock: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
    platformApiMock: { update: vi.fn() },
    emailDomainApiMock: {
      list: vi.fn(),
      add: vi.fn(),
      verify: vi.fn(),
      remove: vi.fn(),
    },
    domainState: { current: [] as unknown[] },
    platformState: state,
    refetchMock: vi.fn(async () => undefined),
  };
});

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string | number>) =>
    Object.entries(values ?? {}).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      key,
    ),
}));

vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('@/lib/api', () => ({
  api: {
    extractServerErrorMessage: (error: unknown, fallback: string) =>
      error instanceof Error ? error.message : fallback,
    isApError: (error: unknown, code: string) =>
      error instanceof Error && error.message === code,
  },
}));

vi.mock('@/api/platforms-api', () => ({ platformApi: platformApiMock }));

vi.mock('@/features/platform-admin/api/email-domain-api', () => ({
  emailDomainApi: emailDomainApiMock,
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
  flagsHooks: {
    queryKey: ['flags'],
    useFlag: (id: string) => ({
      data:
        id === 'EDITION'
          ? flagState.edition
          : id === 'THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP'
          ? flagState.thirdPartyProviders
          : 'https://cloud.test/acs',
    }),
  },
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

const pendingDomain = {
  id: 'domain-1',
  created: '2026-10-14T00:00:00.000Z',
  updated: '2026-10-14T00:00:00.000Z',
  platformId: 'platform-1',
  domain: 'acme.com',
  verificationStatus: SsoDomainVerificationStatus.PENDING_VERIFICATION,
  verificationRecordName: '_activepieces.acme.com',
  verificationRecordValue: 'ap-verify=1',
  peopleCount: 0,
};

const verifiedDomain = {
  ...pendingDomain,
  verificationStatus: SsoDomainVerificationStatus.VERIFIED,
};

const otherVerifiedDomain = {
  ...verifiedDomain,
  id: 'domain-2',
  domain: 'ap.com',
};

const samlConfig = { idpMetadata: '<xml />', idpCertificate: 'cert' };

describe('SSOPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformApiMock.update.mockResolvedValue(undefined);
    mockEmailDomainApi();
    setDomains([]);
    setPlatform({});
    flagState.edition = 'ee';
    flagState.thirdPartyProviders = { google: false };
  });

  it('shows the empty states when nothing is set up', async () => {
    await mount();

    expect(screen.getByText('Authentication')).toBeDefined();
    expect(screen.getByText('No domain verified')).toBeDefined();
    expect(screen.getByText('No allowed domains')).toBeDefined();
    expect(findButton('Set up')).toBeDefined();
    expect(screen.queryByText('Connected')).toBeNull();
  });

  it('adds a domain from its own dialog, not the SAML walkthrough', async () => {
    await mount();

    click(findButton('Add domain'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Add a domain')).toBeDefined();
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: ' Acme.com ' },
    });
    await waitFor(() =>
      expect(findButton('Continue', dialog)?.disabled).toBe(false),
    );
    click(findButton('Continue', dialog));

    await waitFor(() =>
      expect(emailDomainApiMock.add).toHaveBeenCalledWith({
        domain: 'acme.com',
      }),
    );
  });

  it('lets the admin add a domain again after a refused add once the plan allows it', async () => {
    setPlatform({
      plan: { ssoEnabled: true, multipleEmailDomainsEnabled: true },
    });
    setDomains([pendingDomain]);
    emailDomainApiMock.add.mockRejectedValue(new Error('FEATURE_DISABLED'));
    refetchMock.mockImplementation(async () => {
      setPlatform({});
      return undefined;
    });
    await mount();

    click(findButton('Add domain'));
    const addDialog = screen.getByRole('dialog');
    fireEvent.change(within(addDialog).getByRole('textbox'), {
      target: { value: 'beta.com' },
    });
    await waitFor(() =>
      expect(findButton('Continue', addDialog)?.disabled).toBe(false),
    );
    click(findButton('Continue', addDialog));
    await waitFor(() => expect(refetchMock).toHaveBeenCalled());

    setDomains([]);
    click(menuItem('Cancel verification'));
    click(findButton('Cancel verification', screen.getByRole('dialog')));
    await waitFor(() => expect(screen.queryByText('acme.com')).toBeNull());

    click(findButton('Add domain'));
    expect(
      within(screen.getByRole('dialog')).getByText('Add a domain'),
    ).toBeDefined();
  });

  it('shows the domain another admin added and the upsell when an add is refused', async () => {
    await mount();
    setDomains([pendingDomain]);
    emailDomainApiMock.add.mockRejectedValue(new Error('FEATURE_DISABLED'));

    click(findButton('Add domain'));
    const addDialog = screen.getByRole('dialog');
    fireEvent.change(within(addDialog).getByRole('textbox'), {
      target: { value: 'beta.com' },
    });
    await waitFor(() =>
      expect(findButton('Continue', addDialog)?.disabled).toBe(false),
    );
    click(findButton('Continue', addDialog));

    expect(await screen.findByText('acme.com')).toBeDefined();
    expect(await screen.findByText('Unlock multiple domains')).toBeDefined();
  });

  it('shows a domain being verified and continues verifying from its menu', async () => {
    setDomains([pendingDomain]);
    emailDomainApiMock.verify.mockResolvedValue(pendingDomain);
    await mount();

    expect(screen.getByText('acme.com')).toBeDefined();
    expect(screen.getByText('Verifying')).toBeDefined();
    click(menuItem('Continue verifying'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Verify acme.com')).toBeDefined();
    expect(within(dialog).getByText('Verify later')).toBeDefined();
    click(findButton('Verify DNS', dialog));

    await waitFor(() =>
      expect(emailDomainApiMock.verify).toHaveBeenCalledWith('domain-1'),
    );
    await waitFor(() =>
      expect(toastMock.message).toHaveBeenCalledWith(
        'TXT record not found yet — DNS can take a few minutes.',
      ),
    );
  });

  it('cancels a verification in progress', async () => {
    setDomains([pendingDomain]);
    await mount();

    click(menuItem('Cancel verification'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText('Cancel verifying acme.com?'),
    ).toBeDefined();
    click(findButton('Cancel verification', dialog));

    await waitFor(() =>
      expect(emailDomainApiMock.remove).toHaveBeenCalledWith('domain-1'),
    );
  });

  it('shows which day of the 7-day window a pending domain is on', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    vi.setSystemTime(new Date('2026-10-16T12:00:00.000Z'));
    setDomains([pendingDomain]);
    await mount();

    expect(screen.getByText('Waiting for DNS · day 3 of 7')).toBeDefined();
  });

  it('stays on day 7 once the window has passed but the domain is not dropped yet', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    vi.setSystemTime(new Date('2026-10-21T00:30:00.000Z'));
    setDomains([pendingDomain]);
    await mount();

    expect(screen.getByText('Waiting for DNS · day 7 of 7')).toBeDefined();
    expect(screen.queryByText('Waiting for DNS · day 8 of 7')).toBeNull();
  });

  it('shows a verified domain without the DNS check', async () => {
    setDomains([verifiedDomain]);
    await mount();

    expect(screen.getByText('Verified')).toBeDefined();
    expect(screen.queryByText('Check DNS again')).toBeNull();
  });

  it('shows the TXT record from the domain menu', async () => {
    setDomains([verifiedDomain]);
    await mount();

    click(menuItem('View DNS record'));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('DNS record for acme.com')).toBeDefined();
    expect(within(dialog).getByDisplayValue('ap-verify=1')).toBeDefined();
  });

  it('removes the domain and turns off single sign-on in one request', async () => {
    setDomains([verifiedDomain]);
    setPlatform({
      id: 'platform-1',
      federatedAuthProviders: { saml: samlConfig },
    });
    await mount();

    click(menuItem('Remove domain'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        'Remove acme.com and delete your SAML connection?',
      ),
    ).toBeDefined();
    expect(
      within(dialog).getByText(
        'This disables single sign-on and deletes its SAML connection.',
      ),
    ).toBeDefined();
    expect(findButton('Remove domain and disable SAML', dialog)?.disabled).toBe(
      true,
    );
    typeToConfirm(dialog, 'acme.com');
    click(findButton('Remove domain and disable SAML', dialog));

    await waitFor(() =>
      expect(emailDomainApiMock.remove).toHaveBeenCalledWith('domain-1'),
    );
    expect(emailDomainApiMock.remove).toHaveBeenCalledTimes(1);
    expect(platformApiMock.update).not.toHaveBeenCalled();
  });

  it('warns that no other sign-in method is on before removing a domain with SAML connected', async () => {
    setDomains([verifiedDomain]);
    setPlatform({
      federatedAuthProviders: { saml: samlConfig },
      emailAuthEnabled: false,
    });
    await mount();

    click(menuItem('Remove domain'));

    expect(
      within(screen.getByRole('dialog')).getByText(
        "You can't do this while single sign-on is the only way to sign in. Turn on email or Google sign-in first.",
      ),
    ).toBeDefined();
  });

  it('blocks removing the domain when SAML is the only working sign-in method', async () => {
    setDomains([verifiedDomain]);
    setPlatform({
      federatedAuthProviders: { saml: samlConfig },
      emailAuthEnabled: false,
    });
    await mount();

    click(menuItem('Remove domain'));
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).queryByLabelText('Type acme.com to confirm'),
    ).toBeNull();
    expect(findButton('Remove domain and disable SAML', dialog)?.disabled).toBe(
      true,
    );
  });

  it('does not warn about other sign-in methods while Google sign-in is on', async () => {
    setDomains([verifiedDomain]);
    setPlatform({
      federatedAuthProviders: { saml: samlConfig },
      emailAuthEnabled: false,
      googleAuthEnabled: true,
    });
    flagState.thirdPartyProviders = { google: true };
    await mount();

    click(menuItem('Remove domain'));

    expect(
      within(screen.getByRole('dialog')).queryByText(
        "You can't do this while single sign-on is the only way to sign in. Turn on email or Google sign-in first.",
      ),
    ).toBeNull();
  });

  it('still warns when the Google switch is on but Google sign-in is not set up', async () => {
    setDomains([verifiedDomain]);
    setPlatform({
      federatedAuthProviders: { saml: samlConfig },
      emailAuthEnabled: false,
      googleAuthEnabled: true,
    });
    await mount();

    click(menuItem('Remove domain'));

    expect(
      within(screen.getByRole('dialog')).getByText(
        "You can't do this while single sign-on is the only way to sign in. Turn on email or Google sign-in first.",
      ),
    ).toBeDefined();
  });

  it('drops the add-your-company-domain hint once the company domain is listed', async () => {
    setDomains([verifiedDomain]);
    setPlatform({
      allowedAuthDomains: ['acme.com', 'contractors.io'],
    });
    await mount();

    expect(
      screen.queryByText(
        "Add your company domain too, or people at your company can't join or sign in with email and password.",
      ),
    ).toBeNull();
  });

  it('shows the server error when removing the domain fails', async () => {
    setDomains([verifiedDomain]);
    setPlatform({
      federatedAuthProviders: { saml: samlConfig },
    });
    emailDomainApiMock.remove.mockRejectedValue(new Error('Request failed'));
    await mount();

    click(menuItem('Remove domain'));
    typeToConfirm(screen.getByRole('dialog'), 'acme.com');
    click(
      findButton('Remove domain and disable SAML', screen.getByRole('dialog')),
    );

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith('Request failed'),
    );
  });

  it('removes a domain that has no SAML connection', async () => {
    setDomains([verifiedDomain]);
    await mount();

    click(menuItem('Remove domain'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        "To set up single sign-on later, you'll need to verify the domain again with a new DNS record.",
      ),
    ).toBeDefined();
    typeToConfirm(dialog, 'acme.com');
    click(findButton('Remove domain', dialog));

    await waitFor(() =>
      expect(emailDomainApiMock.remove).toHaveBeenCalledWith('domain-1'),
    );
    expect(platformApiMock.update).not.toHaveBeenCalled();
  });

  it('on Cloud, says members of a removed domain lose single sign-on while other domains keep it', async () => {
    flagState.edition = 'cloud';
    setDomains([{ ...verifiedDomain, peopleCount: 3 }, otherVerifiedDomain]);
    setPlatform({ federatedAuthProviders: { saml: samlConfig } });
    await mount();

    click(menuItem('Remove domain'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Remove acme.com?')).toBeDefined();
    expect(within(dialog).getByText('domainRemoveLosesSso')).toBeDefined();
    expect(
      within(dialog).getByText(
        'People at acme.com stop following your sign-in rules. Single sign-on stays on for your other verified domains.',
      ),
    ).toBeDefined();
  });

  it('on self-hosted, says single sign-on stays on when other domains remain', async () => {
    setDomains([{ ...verifiedDomain, peopleCount: 3 }, otherVerifiedDomain]);
    setPlatform({ federatedAuthProviders: { saml: samlConfig } });
    await mount();

    click(menuItem('Remove domain'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByText('domainRemoveLosesSso')).toBeNull();
    expect(
      within(dialog).getByText(
        "Single sign-on stays on. To verify acme.com again, you'll need a new DNS record.",
      ),
    ).toBeDefined();
  });

  it('on self-hosted, still counts the members who lose single sign-on with the last domain', async () => {
    setDomains([{ ...verifiedDomain, peopleCount: 3 }]);
    setPlatform({ federatedAuthProviders: { saml: samlConfig } });
    await mount();

    click(menuItem('Remove domain'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('domainRemoveLosesSso')).toBeDefined();
    expect(
      within(dialog).getByText(
        'This disables single sign-on and deletes its SAML connection.',
      ),
    ).toBeDefined();
  });

  it('shows a connected SAML provider as Manage', async () => {
    setPlatform({ federatedAuthProviders: { saml: samlConfig } });
    await mount();

    expect(screen.getByText('Connected')).toBeDefined();
    expect(findButton('Manage')).toBeDefined();
  });

  it('asks before turning Google off and email on, then sends the same requests as before', async () => {
    setPlatform({
      id: 'platform-1',
      googleAuthEnabled: true,
      emailAuthEnabled: false,
    });
    await mount();

    click(screen.getByRole('switch', { name: 'Continue with Google' }));
    expect(platformApiMock.update).not.toHaveBeenCalled();
    let dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Turn off Google sign-in?')).toBeDefined();
    click(findButton('Turn off', dialog));
    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        { googleAuthEnabled: false },
        'platform-1',
      ),
    );

    click(screen.getByRole('switch', { name: 'Email and password' }));
    dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Turn on email sign-in?')).toBeDefined();
    click(findButton('Turn on', dialog));
    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        { emailAuthEnabled: true },
        'platform-1',
      ),
    );
  });

  it('refreshes the flags after changing Google so the sign-in checks use the new state', async () => {
    const invalidate = vi.spyOn(QueryClient.prototype, 'invalidateQueries');
    setPlatform({ id: 'platform-1' });
    await mount();

    click(screen.getByRole('switch', { name: 'Continue with Google' }));
    click(findButton('Turn on', screen.getByRole('dialog')));

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['flags'] }),
    );
    invalidate.mockRestore();
  });

  it('says Google is not set up on a self-hosted server without Google credentials', async () => {
    setPlatform({ googleAuthEnabled: true });
    await mount();

    expect(screen.getByText('Not set up')).toBeDefined();
    expect(
      screen.getByText('Needs a Google OAuth client on this server.'),
    ).toBeDefined();
    expect(
      screen.getByRole('link', { name: 'Setup guide' }).getAttribute('href'),
    ).toBe('https://www.activepieces.com/docs/admin-guide/guides/sso#google');
  });

  it('shows no Google note once Google sign-in works', async () => {
    setPlatform({ googleAuthEnabled: true });
    flagState.thirdPartyProviders = { google: true };
    await mount();

    expect(screen.queryByText('Not set up')).toBeNull();
  });

  it('never shows the Google note on Cloud', async () => {
    flagState.edition = 'cloud';
    setPlatform({ googleAuthEnabled: true });
    await mount();

    expect(screen.queryByText('Not set up')).toBeNull();
  });

  it('says what self-hosted needs when turning Google on', async () => {
    await mount();
    click(screen.getByRole('switch', { name: 'Continue with Google' }));
    expect(
      within(screen.getByRole('dialog')).getByText(
        'On a self-hosted server it also needs a Google OAuth client.',
        { exact: false },
      ),
    ).toBeDefined();
  });

  it('does not mention self-hosted setup when turning Google on in Cloud', async () => {
    flagState.edition = 'cloud';
    setDomains([verifiedDomain]);
    await mount();
    click(screen.getByRole('switch', { name: 'Continue with Google' }));
    expect(
      within(screen.getByRole('dialog')).queryByText(
        'On a self-hosted server it also needs a Google OAuth client.',
        { exact: false },
      ),
    ).toBeNull();
  });

  it('blocks turning email off when it is the last working sign-in method', async () => {
    setPlatform({ emailAuthEnabled: true, googleAuthEnabled: true });
    await mount();

    click(screen.getByRole('switch', { name: 'Email and password' }));
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).getByText(
        "You can't turn this off while it's the only way to sign in. Turn on another sign-in method first.",
      ),
    ).toBeDefined();
    expect(findButton('Turn off', dialog)?.disabled).toBe(true);
  });

  it('lets email be turned off when single sign-on is connected', async () => {
    setPlatform({
      emailAuthEnabled: true,
      federatedAuthProviders: { saml: samlConfig },
    });
    await mount();

    click(screen.getByRole('switch', { name: 'Email and password' }));
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).queryByText(
        "You can't turn this off while it's the only way to sign in. Turn on another sign-in method first.",
      ),
    ).toBeNull();
    expect(findButton('Turn off', dialog)?.disabled).toBe(false);
  });

  it('lets email be turned off when Google sign-in works', async () => {
    setPlatform({ emailAuthEnabled: true, googleAuthEnabled: true });
    flagState.thirdPartyProviders = { google: true };
    await mount();

    click(screen.getByRole('switch', { name: 'Email and password' }));

    expect(findButton('Turn off', screen.getByRole('dialog'))?.disabled).toBe(
      false,
    );
  });

  it('blocks turning Google off when it works and is the last sign-in method', async () => {
    setPlatform({ emailAuthEnabled: false, googleAuthEnabled: true });
    flagState.thirdPartyProviders = { google: true };
    await mount();

    click(screen.getByRole('switch', { name: 'Continue with Google' }));
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).getByText(
        "You can't turn this off while it's the only way to sign in. Turn on another sign-in method first.",
      ),
    ).toBeDefined();
    expect(findButton('Turn off', dialog)?.disabled).toBe(true);
  });

  it('lets Google be turned off when it does not actually work', async () => {
    setPlatform({ emailAuthEnabled: false, googleAuthEnabled: true });
    await mount();

    click(screen.getByRole('switch', { name: 'Continue with Google' }));
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).queryByText(
        "You can't turn this off while it's the only way to sign in. Turn on another sign-in method first.",
      ),
    ).toBeNull();
    expect(findButton('Turn off', dialog)?.disabled).toBe(false);
  });

  it('locks every sign-in method on Cloud until a domain is verified', async () => {
    flagState.edition = 'cloud';
    await mount();

    expect(screen.getByText('Verify your domain to unlock')).toBeDefined();
    expect(
      screen
        .getByRole('switch', { name: 'Continue with Google' })
        .hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen
        .getByRole('switch', { name: 'Email and password' })
        .hasAttribute('disabled'),
    ).toBe(true);
    expect(findButton('Set up')?.disabled).toBe(true);
    expect(
      screen.getByText(
        'Applies to people with your company email. Guests can use any method.',
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Verify your company's email domain to control how its people sign in.",
      ),
    ).toBeDefined();
  });

  it('keeps the sign-in methods locked on Cloud while the domain is being verified', async () => {
    flagState.edition = 'cloud';
    setDomains([pendingDomain]);
    await mount();

    expect(screen.getByText('Verify your domain to unlock')).toBeDefined();
    expect(
      screen
        .getByRole('switch', { name: 'Email and password' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });

  it('unlocks the sign-in methods on Cloud and names the verified domain', async () => {
    flagState.edition = 'cloud';
    setDomains([verifiedDomain]);
    await mount();

    expect(screen.queryByText('Verify your domain to unlock')).toBeNull();
    expect(
      screen
        .getByRole('switch', { name: 'Email and password' })
        .hasAttribute('disabled'),
    ).toBe(false);
    expect(screen.getByRole('link', { name: 'Set up' })).toBeDefined();
    expect(
      screen.getByText(
        'Applies to people at acme.com. Guests can use any method.',
      ),
    ).toBeDefined();
  });

  it('names every verified domain on Cloud', async () => {
    flagState.edition = 'cloud';
    setDomains([verifiedDomain, otherVerifiedDomain, { ...pendingDomain, id: 'domain-3', domain: 'later.com' }]);
    await mount();

    expect(
      screen.getByText(
        'Applies to people at acme.com, ap.com. Guests can use any method.',
      ),
    ).toBeDefined();
  });

  it('never locks the sign-in methods on self-hosted', async () => {
    await mount();

    expect(screen.queryByText('Verify your domain to unlock')).toBeNull();
    expect(
      screen
        .getByRole('switch', { name: 'Email and password' })
        .hasAttribute('disabled'),
    ).toBe(false);
    expect(screen.getByText('Applies to everyone who signs in.')).toBeDefined();
    expect(
      screen.getByText(
        "Verify your company's email domain to set up single sign-on.",
      ),
    ).toBeDefined();
  });

  it('shows the self-hosted copy on Community', async () => {
    flagState.edition = 'ce';
    await mount();

    expect(screen.queryByText('Verify your domain to unlock')).toBeNull();
    expect(screen.getByText('Applies to everyone who signs in.')).toBeDefined();
    expect(
      screen.getByText(
        "Verify your company's email domain to set up single sign-on.",
      ),
    ).toBeDefined();
  });

  it('says removing the last domain on Cloud gives up control of how its people sign in', async () => {
    flagState.edition = 'cloud';
    setDomains([verifiedDomain]);
    await mount();

    click(menuItem('Remove domain'));

    expect(
      within(screen.getByRole('dialog')).getByText(
        "You'll lose control of how people at acme.com sign in until you verify it again with a new DNS record.",
      ),
    ).toBeDefined();
  });

  it('says removing the last domain on Cloud also stops single sign-on when SAML is connected', async () => {
    flagState.edition = 'cloud';
    setPlatform({ federatedAuthProviders: { saml: samlConfig } });
    setDomains([verifiedDomain]);
    await mount();

    click(menuItem('Remove domain'));

    expect(
      within(screen.getByRole('dialog')).getByText(
        "Single sign-on will stop working, and you'll lose control of how people at acme.com sign in until you verify it again with a new DNS record.",
      ),
    ).toBeDefined();
  });

  it('shows no Google note while the edition is still loading', async () => {
    flagState.edition = '';
    setPlatform({ googleAuthEnabled: true });
    await mount();

    expect(screen.queryByText('Not set up')).toBeNull();
  });

  it('changes nothing when a method change is cancelled', async () => {
    setPlatform({ emailAuthEnabled: true });
    await mount();

    click(screen.getByRole('switch', { name: 'Email and password' }));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        'People can no longer sign in with email and password.',
      ),
    ).toBeDefined();
    click(findButton('Cancel', dialog));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(platformApiMock.update).not.toHaveBeenCalled();
  });

  it('says on self-hosted that allowed domains also limit who can join', async () => {
    await mount();

    expect(
      screen.getByText(
        'Limit who can join, and who can sign in with email and password, to the domains you add.',
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        'Anyone can join or sign in with email and password until you add a domain.',
      ),
    ).toBeDefined();
  });

  it('says on Cloud that allowed domains limit email and password sign-in only', async () => {
    flagState.edition = 'cloud';
    setPlatform({ allowedAuthDomains: ['contractors.io', 'partners.io'] });
    await mount();

    expect(
      screen.getByText(
        'Limit email and password sign-in to the domains you add.',
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Add your company domain too, or people at your company can't sign in with email and password.",
      ),
    ).toBeDefined();
    expect(screen.queryByText(/join/)).toBeNull();

    click(menuItem('Remove domain'));
    expect(
      within(screen.getByRole('dialog')).getByText(
        'People at contractors.io can no longer sign in with email and password.',
      ),
    ).toBeDefined();
  });

  it('describes adding the first allowed domain on Cloud without mentioning joining', async () => {
    flagState.edition = 'cloud';
    await mount();

    click(findLastButton('Add domain'));
    expect(
      within(screen.getByRole('dialog')).getByText(
        'Once a domain is on this list, only people at listed domains can sign in with email and password. Add your company domain too.',
      ),
    ).toBeDefined();
  });

  it('removes one allowed domain and keeps the list enforced', async () => {
    setPlatform({
      id: 'platform-1',
      allowedAuthDomains: ['contractors.io', 'partners.io'],
    });
    await mount();

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
    await mount();

    click(menuItem('Remove domain'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        'With no domains left, anyone can join or sign in with email and password.',
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
    setDomains([verifiedDomain]);
    await mount();

    click(findLastButton('Add domain'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        'Once a domain is on this list, only people at listed domains can join or sign in with email and password. Add your company domain too.',
      ),
    ).toBeDefined();
    fireEvent.change(within(dialog).getByLabelText('Domain'), {
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
    setDomains([verifiedDomain]);
    setPlatform({
      allowedAuthDomains: ['contractors.io'],
    });
    await mount();

    click(findLastButton('Add domain'));
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
    setDomains([verifiedDomain]);
    setPlatform({
      allowedAuthDomains: ['contractors.io'],
    });
    await mount();

    click(findLastButton('Add domain'));
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
    mockEmailDomainApi();
    setDomains([]);
    setPlatform({});
    flagState.edition = 'ee';
    flagState.thirdPartyProviders = { google: false };
  });

  it('is opened from the sign-in methods row as a page, not a dialog', async () => {
    await mount();

    expect(
      screen.getByRole('link', { name: 'Set up' }).getAttribute('href'),
    ).toBe('/platform/sso/saml');
  });

  it('saves the SAML connection with the same request as before and returns to Authentication', async () => {
    setDomains([verifiedDomain]);
    setPlatform({
      id: 'platform-1',
    });
    await mountSetupPage();

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

  it('shows the server error when saving the SAML connection fails', async () => {
    platformApiMock.update.mockRejectedValue(
      new Error('SSO domain must be verified before configuring SAML'),
    );
    setDomains([verifiedDomain]);
    await mountSetupPage();

    fireEvent.change(screen.getByLabelText('IDP Metadata'), {
      target: { value: '<xml />' },
    });
    fireEvent.change(screen.getByLabelText('IDP Certificate'), {
      target: { value: 'cert' },
    });
    await waitFor(() => expect(findButton('Save')?.disabled).toBe(false));
    click(findButton('Save'));

    expect(
      await screen.findByText(
        'SSO domain must be verified before configuring SAML',
      ),
    ).toBeDefined();
  });

  it('offers Disable on the SAML step only, and disables after confirming', async () => {
    setDomains([verifiedDomain]);
    setPlatform({
      id: 'platform-1',
      federatedAuthProviders: { saml: samlConfig },
    });
    await mountSetupPage();

    expect(
      screen
        .getByRole('button', { name: '2 SAML 2.0' })
        .getAttribute('aria-current'),
    ).toBe('step');
    expect(screen.getByText('Disable single sign-on')).toBeDefined();
    click(findButton('1SSO Domain'));
    expect(screen.queryByText('Disable single sign-on')).toBeNull();
    click(findButton('2SAML 2.0'));
    click(findButton('Disable'));
    expect(platformApiMock.update).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Disable single sign-on?')).toBeDefined();
    expect(findButton('Disable', dialog)?.disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText('Type disable to confirm'), {
      target: { value: 'Disable' },
    });
    expect(findButton('Disable', dialog)?.disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText('Type disable to confirm'), {
      target: { value: 'disable' },
    });
    click(findButton('Disable', dialog));

    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        { federatedAuthProviders: { saml: null } },
        'platform-1',
      ),
    );
    expect(await screen.findByText('authentication page')).toBeDefined();
  });

  it('clears the typed confirmation when the Disable dialog is cancelled', async () => {
    setDomains([verifiedDomain]);
    setPlatform({
      federatedAuthProviders: { saml: samlConfig },
    });
    await mountSetupPage();

    click(findButton('Disable'));
    typeToConfirm(screen.getByRole('dialog'), 'disable');
    click(findButton('Cancel', screen.getByRole('dialog')));
    click(findButton('Disable'));

    expect(findButton('Disable', screen.getByRole('dialog'))?.disabled).toBe(
      true,
    );
  });

  it('blocks disabling single sign-on when it is the only working sign-in method', async () => {
    setDomains([verifiedDomain]);
    setPlatform({
      federatedAuthProviders: { saml: samlConfig },
      emailAuthEnabled: false,
    });
    await mountSetupPage();

    click(findButton('Disable'));
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).queryByLabelText('Type disable to confirm'),
    ).toBeNull();
    expect(findButton('Disable', dialog)?.disabled).toBe(true);
  });
  it('shows no Disable when SAML is not connected', async () => {
    setDomains([verifiedDomain]);
    await mountSetupPage();

    expect(findButton('Disable')).toBeUndefined();
    expect(screen.queryByText('Disable single sign-on')).toBeNull();
  });

  it('shows the domain read-only on the first step', async () => {
    setDomains([verifiedDomain]);
    setPlatform({
      federatedAuthProviders: { saml: samlConfig },
    });
    await mountSetupPage();

    expect(screen.getByText('acme.com')).toBeDefined();
    expect(screen.queryByDisplayValue('acme.com')).toBeNull();
    expect(findButton('Next')).toBeDefined();
  });

  it('names the domain being verified in the walkthrough', async () => {
    setDomains([pendingDomain]);
    await mountSetupPage();

    expect(screen.getByText('Verify acme.com')).toBeDefined();
    expect(screen.getByDisplayValue('_activepieces.acme.com')).toBeDefined();
  });

  it('verifies a domain inside the walkthrough when there is none yet', async () => {
    await mountSetupPage();

    fireEvent.change(screen.getByLabelText('Domain'), {
      target: { value: 'acme.com' },
    });
    await waitFor(() => expect(findButton('Continue')?.disabled).toBe(false));
    click(findButton('Continue'));

    await waitFor(() =>
      expect(emailDomainApiMock.add).toHaveBeenCalledWith({
        domain: 'acme.com',
      }),
    );
  });

  it('keeps the SAML step locked until the domain is verified', async () => {
    setDomains([pendingDomain]);
    await mountSetupPage();

    expect(findButton('Next')?.disabled).toBe(true);
    expect(findButton('Verify DNS')?.disabled).toBe(false);
    expect(findButton('2SAML 2.0')?.disabled).toBe(true);
  });

  it('opens the SAML step while the domain is pending when SAML is already connected', async () => {
    setDomains([pendingDomain]);
    setPlatform({
      federatedAuthProviders: { saml: {} },
    });
    await mountSetupPage();

    expect(findButton('2SAML 2.0')?.disabled).toBe(false);
    click(findButton('Next'));
    expect(
      screen
        .getByRole('button', { name: '2 SAML 2.0' })
        .getAttribute('aria-current'),
    ).toBe('step');
    expect(findButton('Save')?.disabled).toBe(true);
  });

  it('moves between steps from the step labels', async () => {
    setDomains([verifiedDomain]);
    await mountSetupPage();

    click(findButton('1SSO Domain'));
    expect(
      screen
        .getByRole('button', { name: '1 SSO Domain' })
        .getAttribute('aria-current'),
    ).toBe('step');
    click(findButton('2SAML 2.0'));
    expect(
      screen
        .getByRole('button', { name: '2 SAML 2.0' })
        .getAttribute('aria-current'),
    ).toBe('step');
  });

  it('shows the values to copy into the identity provider', async () => {
    setDomains([verifiedDomain]);
    await mountSetupPage();

    expect(screen.getByDisplayValue('https://cloud.test/acs')).toBeDefined();
    expect(screen.getByDisplayValue('Activepieces')).toBeDefined();
  });

  it('says a cleared SAML field is required', async () => {
    setDomains([verifiedDomain]);
    await mountSetupPage();

    const metadata = screen.getByLabelText('IDP Metadata');
    fireEvent.change(metadata, { target: { value: 'x' } });
    fireEvent.change(metadata, { target: { value: '' } });

    const error = await screen.findByText('required');
    await waitFor(() =>
      expect(metadata.getAttribute('aria-invalid')).toBe('true'),
    );
    expect(metadata.getAttribute('aria-describedby')).toContain(error.id);
  });

  it('shows an error instead of an empty domain step when the domains fail to load', async () => {
    emailDomainApiMock.list.mockRejectedValue(new Error('Request failed'));
    await mountSetupPage();

    expect(screen.getByText('Trouble loading domains')).toBeDefined();
    expect(screen.queryByLabelText('Domain')).toBeNull();
  });

  it('keeps the typed SAML values when a later refresh of the domains fails', async () => {
    setDomains([verifiedDomain]);
    const client = await mountSetupPage();
    fireEvent.change(screen.getByLabelText('IDP Metadata'), {
      target: { value: '<xml />' },
    });

    emailDomainApiMock.list.mockRejectedValue(new Error('Request failed'));
    await act(async () => {
      await client.refetchQueries({ queryKey: ['email-domains'] });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(client.getQueryState(['email-domains'])?.status).toBe('error');
    expect(screen.queryByText('Trouble loading domains')).toBeNull();
    expect(
      screen.getByLabelText<HTMLTextAreaElement>('IDP Metadata').value,
    ).toBe('<xml />');
  });

  it('says the SAML values are saved instead of looking empty', async () => {
    setDomains([verifiedDomain]);
    setPlatform({
      federatedAuthProviders: { saml: samlConfig },
    });
    await mountSetupPage();

    expect(
      screen.getByText('To change the connection, paste both values again.'),
    ).toBeDefined();

    expect(
      screen.getByLabelText('IDP Metadata').getAttribute('placeholder'),
    ).toBe('Saved. Paste new metadata to replace it.');
    expect(
      screen.getByLabelText('IDP Certificate').getAttribute('placeholder'),
    ).toBe('Saved. Paste a new certificate to replace it.');
  });
});

async function submitWhenValid(dialog: HTMLElement) {
  await waitFor(() =>
    expect(findButton('Add domain', dialog)?.disabled).toBe(false),
  );
  click(findButton('Add domain', dialog));
}

function typeToConfirm(dialog: HTMLElement, text: string) {
  fireEvent.change(within(dialog).getByLabelText(`Type ${text} to confirm`), {
    target: { value: text },
  });
}

function mockEmailDomainApi() {
  emailDomainApiMock.list.mockImplementation(async () => domainState.current);
  emailDomainApiMock.add.mockResolvedValue(pendingDomain);
  emailDomainApiMock.verify.mockResolvedValue(pendingDomain);
  emailDomainApiMock.remove.mockResolvedValue(undefined);
}

function setDomains(domains: unknown[]) {
  domainState.current = domains;
}

function setPlatform(overrides: Record<string, unknown>) {
  platformState.current = {
    id: 'platform-1',
    plan: { ssoEnabled: true, multipleEmailDomainsEnabled: false },
    federatedAuthProviders: {},
    googleAuthEnabled: false,
    emailAuthEnabled: true,
    allowedAuthDomains: [],
    ...overrides,
  };
}

async function mount() {
  const client = newQueryClient();
  render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <SSOPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
  await waitFor(() => expect(client.isFetching()).toBe(0));
}

async function mountSetupPage() {
  const client = newQueryClient();
  render(
    <MemoryRouter initialEntries={['/platform/sso/saml']}>
      <QueryClientProvider client={client}>
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
  await waitFor(() => expect(client.isFetching()).toBe(0));
  return client;
}

function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
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

function findLastButton(text: string) {
  return Array.from(document.body.querySelectorAll('button'))
    .filter((button) => button.textContent === text)
    .at(-1);
}

function findButton(text: string, scope: ParentNode = document.body) {
  return Array.from(scope.querySelectorAll('button')).find(
    (button) => button.textContent === text,
  );
}
