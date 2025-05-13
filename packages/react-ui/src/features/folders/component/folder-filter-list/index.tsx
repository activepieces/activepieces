import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Layers, Shapes } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { isNil, Permission } from '@activepieces/shared';

import { foldersHooks } from '../../lib/folders-hooks';
import { foldersUtils } from '../../lib/folders-utils';

import { FoldersContainer } from './folders-container';

export const folderIdParamName = 'folderId';

const FolderFilterList = ({ refresh }: { refresh: number }) => {
  const location = useLocation();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToUpdateFolders = checkAccess(Permission.WRITE_FOLDER);
  const [searchParams, setSearchParams] = useSearchParams(location.search);
  const selectedFolderId = searchParams.get(folderIdParamName);

  const updateSearchParams = (folderId: string | undefined) => {
    const newQueryParameters: URLSearchParams = new URLSearchParams(
      searchParams,
    );

    if (folderId) {
      newQueryParameters.set(folderIdParamName, folderId);
    } else {
      newQueryParameters.delete(folderIdParamName);
    }

    // Reset cursor whenever the folder changes
    newQueryParameters.delete('cursor');
    setSearchParams(newQueryParameters);
  };

  const {
    folders,
    isLoading,
    refetch: refetchFolders,
  } = foldersHooks.useFolders();

  const { data: allFlowsCount, refetch: refetchAllFlowsCount } = useQuery({
    queryKey: ['flowsCount', authenticationSession.getProjectId()],
    queryFn: flowsApi.count,
  });

  useEffect(() => {
    refetchFolders();
    refetchAllFlowsCount();
  }, [refresh, refetchFolders, refetchAllFlowsCount]);

  const isInUncategorized = selectedFolderId === 'NULL';
  const isInAllFlows = isNil(selectedFolderId);
  const uncategorizedCount = foldersUtils.extractUncategorizedFlows(
    allFlowsCount,
    folders,
  );

  return (
    <div className="flex items-center gap-2 w-full whitespace-nowrap">
      {/* Fixed buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant={isInAllFlows ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => updateSearchParams(undefined)}
          className="group border h-9 flex-shrink-0"
        >
          <Layers className="mr-2 h-4 w-4 " />
          {t('All')}
          <span className="text-xs text-muted-foreground ml-1">
            ({allFlowsCount})
          </span>
        </Button>

        <Button
          variant={isInUncategorized ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => updateSearchParams('NULL')}
          className="group border h-9 flex-shrink-0"
        >
          <Shapes className="mr-2 h-4 w-4" />
          {t('Uncategorized')}
          <span className="text-xs text-muted-foreground ml-1">
            ({uncategorizedCount})
          </span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 w-px bg-border mx-1" />

      {/* Scrollable folders container */}
      <div className="flex-1 min-w-0 w-[100px]">
        {!isLoading && (
          <FoldersContainer
            folders={folders || []}
            selectedFolderId={selectedFolderId}
            updateSearchParams={updateSearchParams}
            refetchFolders={refetchFolders}
            userHasPermissionToUpdateFolders={userHasPermissionToUpdateFolders}
          />
        )}
      </div>
    </div>
  );
};

export { FolderFilterList };
