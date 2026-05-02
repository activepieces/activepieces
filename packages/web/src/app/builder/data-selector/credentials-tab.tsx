import { AppConnectionKind, Permission } from '@activepieces/shared';
import { t } from 'i18next';
import { KeyRound, SearchXIcon } from 'lucide-react';
import { useState } from 'react';

import { SearchInput } from '@/components/custom/search-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { appConnectionsQueries } from '@/features/connections';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';

const CredentialsTab = () => {
  const insertMention = useBuilderStateContext((state) => state.insertMention);
  const [search, setSearch] = useState('');
  const projectId = authenticationSession.getProjectId();
  const { checkAccess } = useAuthorization();
  const canRead = checkAccess(Permission.READ_APP_CONNECTION);

  const { data, isLoading } = appConnectionsQueries.useAppConnections({
    request: {
      projectId: projectId ?? '',
      limit: 200,
      kind: AppConnectionKind.SECRET,
    },
    extraKeys: ['data-selector-secrets', projectId ?? ''],
    enabled: !!projectId && canRead,
  });

  const secrets = (data?.data ?? []).filter((secret) =>
    search
      ? secret.displayName.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 px-5">
        <SearchInput
          onChange={setSearch}
          value={search}
          placeholder={t('Search credentials')}
        />
      </div>

      <ScrollArea className="transition-all flex-1 w-full">
        {isLoading && (
          <div className="text-center text-sm text-muted-foreground py-8">
            {t('Loading…')}
          </div>
        )}

        {!isLoading && secrets.length === 0 && (
          <div className="flex items-center justify-center gap-2 mt-5 flex-col px-6">
            <SearchXIcon className="w-[35px] h-[35px]" />
            <div className="text-center font-semibold text-md">
              {search
                ? t('No matching credentials')
                : t('No credentials available')}
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {search
                ? t('Try adjusting your search')
                : t(
                    'Create credentials in the Connections page · Credentials tab.',
                  )}
            </div>
          </div>
        )}

        {!isLoading && secrets.length > 0 && (
          <div className="flex flex-col">
            {secrets.map((secret) => (
              <div
                key={secret.id}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    if (insertMention) {
                      insertMention(`connections['${secret.externalId}'].secret_text`);
                    }
                  }
                }}
                onClick={() => {
                  if (insertMention) {
                    insertMention(`connections['${secret.externalId}'].secret_text`);
                  }
                }}
                className={cn(
                  'group w-full max-w-full select-none focus:outline-hidden',
                  'hover:bg-accent dark:hover:bg-accent/20 focus:bg-accent focus:bg-opacity-75',
                  'cursor-pointer flex items-center gap-3 px-5 py-3',
                )}
              >
                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm truncate">
                    {secret.displayName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

CredentialsTab.displayName = 'CredentialsTab';
export { CredentialsTab };
