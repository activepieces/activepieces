import { useUser } from '@clerk/clerk-react';
import { t } from 'i18next';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const PROVIDERS: { strategy: string; label: string; icon: string }[] = [
  { strategy: 'oauth_google', label: 'Google', icon: 'G' },
  { strategy: 'oauth_github', label: 'GitHub', icon: '⌥' },
  { strategy: 'oauth_microsoft', label: 'Microsoft', icon: 'M' },
];

function providerLabel(provider: string) {
  return (
    PROVIDERS.find((p) => p.strategy === `oauth_${provider}`)?.label ??
    provider.charAt(0).toUpperCase() + provider.slice(1)
  );
}

function providerIcon(provider: string) {
  return (
    PROVIDERS.find((p) => p.strategy === `oauth_${provider}`)?.icon ??
    provider.charAt(0).toUpperCase()
  );
}

type ExternalAccount = NonNullable<
  ReturnType<typeof useUser>['user']
>['externalAccounts'][number];

function ConnectedAccountRow({ account }: { account: ExternalAccount }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await account.destroy();
      toast.success(t('Account disconnected.'));
    } catch {
      toast.error(t('Failed to disconnect account.'));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2.5">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
        {providerIcon(account.provider)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{providerLabel(account.provider)}</p>
        {account.emailAddress && (
          <p className="text-xs text-muted-foreground truncate">
            {account.emailAddress}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {account.verification?.status === 'verified' ? (
          <Badge
            variant="outline"
            className="text-xs px-1.5 py-0 text-emerald-500 border-emerald-500/30"
          >
            {t('Connected')}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-xs px-1.5 py-0 text-yellow-500 border-yellow-500/30"
          >
            {t('Pending')}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          disabled={removing}
          onClick={handleRemove}
        >
          {removing ? (
            <LoadingSpinner className="w-3.5 h-3.5" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function ConnectionsSettingsPage() {
  const { user, isLoaded } = useUser();
  const [connecting, setConnecting] = useState<string | null>(null);

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner />
      </div>
    );
  }

  const connectedProviders = new Set(
    user.externalAccounts.map((a) => `oauth_${a.provider}`),
  );

  const handleConnect = async (strategy: string) => {
    setConnecting(strategy);
    try {
      const externalAccount = await user.createExternalAccount({
        strategy: strategy as Parameters<
          typeof user.createExternalAccount
        >[0]['strategy'],
        redirectUrl: window.location.href,
      });
      const redirectUrl =
        externalAccount.verification?.externalVerificationRedirectURL;
      if (redirectUrl) {
        window.location.href = redirectUrl.toString();
      } else {
        toast.error(t('Failed to get OAuth redirect URL.'));
        setConnecting(null);
      }
    } catch (err) {
      const msg =
        err &&
        typeof err === 'object' &&
        Array.isArray((err as Record<string, unknown>)['errors'])
          ? String(
              (
                (err as Record<string, unknown>)['errors'] as Record<
                  string,
                  unknown
                >[]
              )[0]?.['longMessage'] ?? 'Failed to connect account.',
            )
          : t('Failed to connect account.');
      toast.error(msg);
      setConnecting(null);
    }
  };

  return (
    <div className="max-w-xl px-8 py-8 flex flex-col gap-8">
      <div>
        <h2 className="text-base font-semibold">{t('Connected Accounts')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Manage your connected OAuth accounts.')}
        </p>
      </div>

      <Separator />

      {user.externalAccounts.length > 0 ? (
        <div className="flex flex-col gap-2">
          {user.externalAccounts.map((account) => (
            <ConnectedAccountRow key={account.id} account={account} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('No connected accounts.')}
        </p>
      )}

      <Separator />

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">{t('Connect an account')}</p>
        <div className="flex flex-col gap-2">
          {PROVIDERS.filter((p) => !connectedProviders.has(p.strategy)).map(
            (provider) => (
              <Button
                key={provider.strategy}
                variant="outline"
                className="justify-start gap-3 h-10"
                disabled={connecting === provider.strategy}
                onClick={() => handleConnect(provider.strategy)}
              >
                {connecting === provider.strategy ? (
                  <LoadingSpinner className="w-4 h-4" />
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">
                    {provider.icon}
                  </span>
                )}
                {t('Connect with {provider}', { provider: provider.label })}
              </Button>
            ),
          )}
          {PROVIDERS.every((p) => connectedProviders.has(p.strategy)) && (
            <p className="text-sm text-muted-foreground">
              {t('All supported providers are connected.')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
