import { AppConnectionKind, Permission } from '@activepieces/shared';
import { t } from 'i18next';
import { KeyRound, Plus, SearchXIcon } from 'lucide-react';
import { useState } from 'react';

import { ProjectSettingsDialog } from '@/app/components/project-settings';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { appConnectionsQueries } from '@/features/connections';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';

const CredentialsTab = () => {
  const insertMention = useBuilderStateContext((state) => state.insertMention);
  const [search, setSearch] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const projectId = authenticationSession.getProjectId();
  const { checkAccess } = useAuthorization();
  const canRead = checkAccess(Permission.READ_APP_CONNECTION);
  const canWrite = checkAccess(Permission.WRITE_APP_CONNECTION);

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

  const hasAny = (data?.data ?? []).length > 0;

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 px-5">
        <SearchInput
          onChange={setSearch}
          value={search}
          placeholder={t('Search credentials')}
        />
        {canWrite && hasAny && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            onClick={() => setSettingsOpen(true)}
          >
            <Plus className="w-4 h-4" />
            {t('New')}
          </Button>
        )}
      </div>

      <ScrollArea className="transition-all flex-1 w-full">
        {isLoading && (
          <div className="text-center text-sm text-muted-foreground py-8">
            {t('Loading…')}
          </div>
        )}

        {!isLoading && secrets.length === 0 && (
          <div className="flex items-center justify-center gap-2 mt-5 flex-col px-6">
            {search ? (
              <>
                <SearchXIcon className="w-[35px] h-[35px]" />
                <div className="text-center font-semibold text-md">
                  {t('No matching credentials')}
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {t('Try adjusting your search')}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div className="text-center font-semibold text-md">
                  {t('No credentials yet')}
                </div>
                <div className="text-center text-sm text-muted-foreground max-w-[280px]">
                  {t(
                    'Create a credential to securely reference a value from any step input.',
                  )}
                </div>
                {canWrite && (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2 gap-1.5"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    {t('New credential')}
                  </Button>
                )}
              </>
            )}
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
                      insertMention(
                        `connections['${secret.externalId}'].secret_text`,
                      );
                    }
                  }
                }}
                onClick={() => {
                  if (insertMention) {
                    insertMention(
                      `connections['${secret.externalId}'].secret_text`,
                    );
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

      <ProjectSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab="credentials"
      />
    </div>
  );
};

CredentialsTab.displayName = 'CredentialsTab';
export { CredentialsTab };
