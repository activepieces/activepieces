import { Permission } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus, SearchXIcon, Variable } from 'lucide-react';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';

import { VariableDialog } from '@/app/variables/variable-dialog';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { variablesQueries } from '@/features/variables/hooks/variables-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';

const VariablesTab = () => {
  const insertMention = useBuilderStateContext((state) => state.insertMention);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 250);
  const [createOpen, setCreateOpen] = useState(false);
  const projectId = authenticationSession.getProjectId();
  const { checkAccess } = useAuthorization();
  const canRead = checkAccess(Permission.READ_VARIABLE);
  const canWrite = checkAccess(Permission.WRITE_VARIABLE);

  const { data, isLoading, refetch } = variablesQueries.useVariables({
    request: {
      projectId: projectId ?? '',
      limit: 50,
      name: debouncedSearch || undefined,
    },
    extraKeys: ['data-selector-variables', projectId ?? '', debouncedSearch],
    enabled: !!projectId && canRead,
  });

  const variables = data?.data ?? [];

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 px-5">
        <SearchInput
          onChange={setSearch}
          value={search}
          placeholder={t('Search variables')}
        />
        {canWrite && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            onClick={() => setCreateOpen(true)}
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

        {!isLoading && variables.length === 0 && (
          <div className="flex items-center justify-center gap-2 mt-5 flex-col px-6">
            {debouncedSearch ? (
              <>
                <SearchXIcon className="w-[35px] h-[35px]" />
                <div className="text-center font-semibold text-md">
                  {t('No matching variables')}
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {t('Try adjusting your search')}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                  <Variable className="w-5 h-5" />
                </div>
                <div className="text-center font-semibold text-md">
                  {t('No variables yet')}
                </div>
                <div className="text-center text-sm text-muted-foreground max-w-[280px]">
                  {t(
                    'Create a variable to reference a value from any step input.',
                  )}
                </div>
                {canWrite && (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2 gap-1.5"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    {t('New variable')}
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {!isLoading && variables.length > 0 && (
          <div className="flex flex-col">
            {variables.map((variable) => (
              <div
                key={variable.id}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    if (insertMention) {
                      insertMention(`variables['${variable.name}']`);
                    }
                  }
                }}
                onClick={() => {
                  if (insertMention) {
                    insertMention(`variables['${variable.name}']`);
                  }
                }}
                className={cn(
                  'group w-full max-w-full select-none focus:outline-hidden',
                  'hover:bg-accent dark:hover:bg-accent/20 focus:bg-accent focus:bg-opacity-75',
                  'cursor-pointer flex items-center gap-3 px-5 py-3',
                )}
              >
                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
                  <Variable className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm truncate">
                    {variable.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <VariableDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => refetch()}
      />
    </div>
  );
};

VariablesTab.displayName = 'VariablesTab';
export { VariablesTab };
