import { ApiKeyResponseWithoutValue } from '@activepieces/shared';
import { t } from 'i18next';
import { Key, MoreHorizontal, Trash } from 'lucide-react';
import { useState } from 'react';

import {
  AdminEmpty,
  AdminPage,
  AdminPageHeader,
  AdminQueryState,
  ConfirmDialog,
  SettingsPanel,
  SettingsRow,
  adminPageResources,
  useAdminAction,
} from '@/app/components/admin';
import { NewApiKeyDialog } from '@/app/routes/platform/security/api-keys/new-api-key-dialog';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  apiKeyApi,
  apiKeyKeys,
  apiKeyQueries,
} from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { formatUtils } from '@/lib/format-utils';

import { sampleData } from '../../sample-data';

const ApiKeysPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data, isLoading, isError, refetch } = apiKeyQueries.useApiKeys();
  const isSample = !platform.plan.apiKeysEnabled;
  const keys: ApiKeyResponseWithoutValue[] = isSample
    ? sampleData.apiKeysPage().data
    : data?.data ?? [];
  const [revokeTarget, setRevokeTarget] =
    useState<ApiKeyResponseWithoutValue | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const revokeKey = useAdminAction<ApiKeyResponseWithoutValue>({
    verb: 'revoke',
    name: (apiKey) => apiKey.displayName.trim() || t('API key'),
    run: (apiKey) => apiKeyApi.delete(apiKey.id),
    invalidate: [apiKeyKeys.all],
  });

  return (
    <AdminPage width="content">
      <AdminPageHeader
        title={t('API Keys')}
        description={t('Manage API keys to access Activepieces APIs.')}
        resources={adminPageResources.apiKeys}
      >
        <NewApiKeyDialog onCreate={() => refetch()}>
          <AnimatedIconButton
            icon={PlusIcon}
            iconSize={16}
            {...adminControl(AdminControl.API_KEYS_API_KEY_OPEN)}
          >
            {t('New API Key')}
          </AnimatedIconButton>
        </NewApiKeyDialog>
      </AdminPageHeader>

      <AdminQueryState
        isLoading={isLoading && !isSample}
        isError={isError && !isSample}
        hasData={data !== undefined}
        onRetry={refetch}
        entity={t('API keys')}
        isEmpty={keys.length === 0}
        empty={
          <AdminEmpty
            className="flex-none"
            icon={<Key />}
            title={t('No API keys yet')}
            description={t('Create one to get started.')}
          />
        }
      >
        <SettingsPanel flush>
          {keys.map((apiKey) => (
            <SettingsRow
              key={apiKey.id}
              icon={<Key />}
              title={apiKey.displayName}
              description={
                <span className="text-xs">
                  <span className="font-mono">
                    sk-...{apiKey.truncatedValue}
                  </span>
                  {' · '}
                  {t('Created')}{' '}
                  {formatUtils.formatDateToAgo(new Date(apiKey.created))}
                  {apiKey.lastUsedAt ? (
                    <>
                      {' '}
                      · {t('Last used')}{' '}
                      {formatUtils.formatDateToAgo(new Date(apiKey.lastUsedAt))}
                    </>
                  ) : (
                    <> · {t('Never used')}</>
                  )}
                </span>
              }
            >
              <DropdownMenu modal={true}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('Actions')}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => {
                      setRevokeTarget(apiKey);
                      setRevokeOpen(true);
                    }}
                    {...adminControl(AdminControl.API_KEYS_API_KEY_REVOKE_OPEN)}
                  >
                    <Trash className="size-4" />
                    {t('Revoke API Key')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SettingsRow>
          ))}
        </SettingsPanel>
      </AdminQueryState>
      {revokeTarget && (
        <ConfirmDialog
          open={revokeOpen}
          onOpenChange={setRevokeOpen}
          title={t('Revoke {name}?', {
            name: revokeTarget.displayName.trim() || t('API key'),
          })}
          description={t(
            'Revoking this API key will immediately break any integrations using it. This action cannot be undone.',
          )}
          confirmLabel={t('Revoke')}
          controlId={AdminControl.API_KEYS_API_KEY_REVOKE_CONFIRM}
          onConfirm={() => revokeKey.mutateAsync(revokeTarget)}
        />
      )}
    </AdminPage>
  );
};

ApiKeysPage.displayName = 'ApiKeysPage';
export { ApiKeysPage };
