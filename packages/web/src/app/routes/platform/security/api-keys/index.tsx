import { ApiKeyResponseWithoutValue } from '@activepieces/shared';
import { t } from 'i18next';
import { Key, MoreHorizontal, Trash } from 'lucide-react';

import { NewApiKeyDialog } from '@/app/routes/platform/security/api-keys/new-api-key-dialog';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { Page, PageHeader } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { internalErrorToast } from '@/components/ui/sonner';
import { apiKeyApi, apiKeyQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';

import { sampleData } from '../../sample-data';

const ApiKeysPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data, isLoading, refetch } = apiKeyQueries.useApiKeys();
  const isSample = !platform.plan.apiKeysEnabled;
  const keys: ApiKeyResponseWithoutValue[] = isSample
    ? sampleData.apiKeysPage().data
    : data?.data ?? [];

  return (
    <Page>
      <PageHeader
        title={t('API Keys')}
        description={t('Manage API keys to access Activepieces APIs.')}
      >
        <NewApiKeyDialog onCreate={() => refetch()}>
          <AnimatedIconButton icon={PlusIcon} iconSize={20}>
            {t('New API Key')}
          </AnimatedIconButton>
        </NewApiKeyDialog>
      </PageHeader>
      {isLoading && !isSample && (
        <SkeletonList numberOfItems={3} className="h-14 rounded-2xl" />
      )}

      {!isLoading && keys.length === 0 && (
        <Panel flush>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Key />
              </EmptyMedia>
              <EmptyDescription>
                {t('No API keys yet. Create one to get started.')}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Panel>
      )}

      {!isLoading && keys.length > 0 && (
        <Panel flush>
          <ItemGroup className="px-1">
            {keys.map((apiKey) => (
              <Item key={apiKey.id}>
                <ItemMedia variant="icon">
                  <Key />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{apiKey.displayName}</ItemTitle>
                  <ItemDescription>
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
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <ConfirmDialog
                        title={t('Revoke {name}?', {
                          name: apiKey.displayName,
                        })}
                        description={t(
                          'The key stops working immediately and cannot be restored.',
                        )}
                        consequence={t(
                          'Integrations using this key stop working immediately.',
                        )}
                        confirmLabel={t('Revoke')}
                        typeToConfirm={apiKey.displayName}
                        onConfirm={async () => {
                          await apiKeyApi.delete(apiKey.id);
                          refetch();
                        }}
                        onError={() => internalErrorToast()}
                      >
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash />
                          {t('Revoke API Key')}
                        </DropdownMenuItem>
                      </ConfirmDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </Panel>
      )}
    </Page>
  );
};

ApiKeysPage.displayName = 'ApiKeysPage';
export { ApiKeysPage };
