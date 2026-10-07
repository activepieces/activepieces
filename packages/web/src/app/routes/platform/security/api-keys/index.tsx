import { ApiKeyResponseWithoutValue } from '@activepieces/shared';
import { t } from 'i18next';
import { Key, MoreHorizontal, Trash } from 'lucide-react';

import {
  AdminEmpty,
  AdminPage,
  AdminPageHeader,
  SettingsPanel,
  SettingsRow,
  adminPageResources,
} from '@/app/components/admin';
import { NewApiKeyDialog } from '@/app/routes/platform/security/api-keys/new-api-key-dialog';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SkeletonList } from '@/components/ui/skeleton';
import { internalErrorToast } from '@/components/ui/sonner';
import { apiKeyApi, apiKeyQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { formatUtils } from '@/lib/format-utils';

import { sampleData } from '../../sample-data';

const ApiKeysPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data, isLoading, refetch } = apiKeyQueries.useApiKeys();
  const isSample = !platform.plan.apiKeysEnabled;
  const keys: ApiKeyResponseWithoutValue[] = isSample
    ? sampleData.apiKeysPage().data
    : data?.data ?? [];
  const showLoading = isLoading && !isSample;

  return (
    <AdminPage width="narrow">
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

      {showLoading && <SkeletonList numberOfItems={3} className="h-18" />}

      {!showLoading && keys.length === 0 && (
        <AdminEmpty
          className="flex-none"
          icon={<Key />}
          title={t('No API keys yet. Create one to get started.')}
        />
      )}

      {!showLoading && keys.length > 0 && (
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
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <ConfirmationDeleteDialog
                    title={t('Revoke API Key')}
                    message={t(
                      'Revoking this API key will immediately break any integrations using it. This action cannot be undone.',
                    )}
                    entityName={t('API Key')}
                    buttonText={t('Revoke')}
                    controlId={AdminControl.API_KEYS_API_KEY_REVOKE_CONFIRM}
                    mutationFn={async () => {
                      await apiKeyApi.delete(apiKey.id);
                      refetch();
                    }}
                    onError={() => internalErrorToast()}
                  >
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={(e) => e.preventDefault()}
                      {...adminControl(
                        AdminControl.API_KEYS_API_KEY_REVOKE_OPEN,
                      )}
                    >
                      <Trash className="size-4" />
                      {t('Revoke API Key')}
                    </DropdownMenuItem>
                  </ConfirmationDeleteDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </SettingsRow>
          ))}
        </SettingsPanel>
      )}
    </AdminPage>
  );
};

ApiKeysPage.displayName = 'ApiKeysPage';
export { ApiKeysPage };
