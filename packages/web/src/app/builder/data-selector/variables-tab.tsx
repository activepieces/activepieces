import { Permission } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Plus, SearchXIcon, Variable } from 'lucide-react';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';

import { VariableDialog } from '@/app/variables/variable-dialog';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
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
      <div className="flex items-center gap-2 px-4">
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
            className="shrink-0"
            onClick={() => setCreateOpen(true)}
          >
            <Plus />
            {t('New')}
          </Button>
        )}
      </div>

      <ScrollArea className="transition-all flex-1 w-full">
        {isLoading && (
          <div className="text-center text-sm text-gray-11 py-8">
            {t('Loading…')}
          </div>
        )}

        {!isLoading && variables.length === 0 && (
          <Empty>
            {debouncedSearch ? (
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchXIcon />
                </EmptyMedia>
                <EmptyTitle>{t('No matching variables')}</EmptyTitle>
                <EmptyDescription>
                  {t('Try adjusting your search')}
                </EmptyDescription>
              </EmptyHeader>
            ) : (
              <>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Variable />
                  </EmptyMedia>
                  <EmptyTitle>{t('No variables yet')}</EmptyTitle>
                  <EmptyDescription>
                    {t(
                      'Create a variable to reference a value from any step input.',
                    )}
                  </EmptyDescription>
                </EmptyHeader>
                {canWrite && (
                  <EmptyContent>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setCreateOpen(true)}
                    >
                      <Plus />
                      {t('New variable')}
                    </Button>
                  </EmptyContent>
                )}
              </>
            )}
          </Empty>
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
                  'hover:bg-gray-4 focus:bg-gray-4',
                  'flex h-10 cursor-pointer items-center gap-2 px-4',
                )}
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-3 text-accent-11">
                  <Variable className="size-3.5" />
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
