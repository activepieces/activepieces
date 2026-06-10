import { ApiKeyResponseWithoutValue } from '@activepieces/shared';
import { t } from 'i18next';
import { Key, MoreHorizontal, Trash } from 'lucide-react';

import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { NewApiKeyDialog } from '@/app/routes/platform/security/api-keys/new-api-key-dialog';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/custom/item';
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
import { formatUtils } from '@/lib/format-utils';

const ApiKeysPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { data, isLoading, refetch } = apiKeyQueries.useApiKeys();

  const keys: ApiKeyResponseWithoutValue[] = data?.data ?? [];

  return (
    <LockedFeatureGuard
      featureKey="API"
      locked={!platform.plan.apiKeysEnabled}
      lockTitle={t('Enable API Keys')}
      lockDescription={t(
        'Create and manage API keys to access Activepieces APIs.',
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/api-keys.mp4"
    >
      <CenteredPage
        title={t('API Keys')}
        description={t('Manage API keys to access Activepieces APIs.')}
        actions={
          <NewApiKeyDialog onCreate={() => refetch()}>
            <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm">
              {t('New API Key')}
            </AnimatedIconButton>
          </NewApiKeyDialog>
        }
      >
        {isLoading && (
          <SkeletonList numberOfItems={3} className="w-full h-[72px]" />
        )}

        {!isLoading && keys.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Key className="size-10" />
            <p className="text-sm">
              {t('No API keys yet. Create one to get started.')}
            </p>
          </div>
        )}

        {!isLoading && keys.length > 0 && (
          <ItemGroup className="gap-2">
            {keys.map((apiKey) => (
              <Item key={apiKey.id} variant="outline" size="sm">
                <ItemMedia variant="icon">
                  <Key />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{apiKey.displayName}</ItemTitle>
                  <ItemDescription className="text-xs">
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
                        {formatUtils.formatDateToAgo(
                          new Date(apiKey.lastUsedAt),
                        )}
                      </>
                    ) : (
                      <> · {t('Never used')}</>
                    )}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <DropdownMenu modal={true}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="size-8 p-0">
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
                        mutationFn={async () => {
                          await apiKeyApi.delete(apiKey.id);
                          refetch();
                        }}
                        onError={() => internalErrorToast()}
                      >
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash className="size-4 mr-2 text-destructive" />
                          {t('Revoke API Key')}
                        </DropdownMenuItem>
                      </ConfirmationDeleteDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </CenteredPage>
    </LockedFeatureGuard>
  );
};

ApiKeysPage.displayName = 'ApiKeysPage';
export { ApiKeysPage };
