import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ArrowDownZA,
  ArrowUpAz,
  Folder,
  Shapes,
  TableProperties,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { TextWithIcon } from '@/components/ui/text-with-icon';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { FolderDto, isNil, Permission } from '@activepieces/shared';

import { foldersHooks } from '../lib/folders-hooks';
import { foldersUtils } from '../lib/folders-utils';

import { CreateFolderDialog } from './create-folder-dialog';
import { FolderActions } from './folder-actions';

const FolderIcon = () => {
  return <Folder className="w-4 h-4" />;
};

type FolderItemProps = {
  folder: FolderDto;
  refetch: () => void;
  updateSearchParams: (folderId: string | undefined) => void;
  selectedFolderId: string | null;
};

const FolderItem = ({
  folder,
  refetch,
  updateSearchParams,
  selectedFolderId,
}: FolderItemProps) => {
  return (
    <div key={folder.id} className="group">
      <Button
        variant="ghost"
        className={cn(
          'w-full  items-center justify-start group/item gap-2 pl-4 pr-0',
          {
            'bg-accent dark:bg-accent/50': selectedFolderId === folder.id,
          },
        )}
        onClick={() => updateSearchParams(folder.id)}
      >
        <TextWithIcon
          className="flex-grow"
          icon={<FolderIcon />}
          text={
            <div
              className={cn(
                'flex-grow max-w-[150px] text-start truncate whitespace-nowrap overflow-hidden',
                {
                  'font-medium': selectedFolderId === folder.id,
                },
              )}
            >
              {folder.displayName}
            </div>
          }
        >
          <FolderActions folder={folder} refetch={refetch} />
        </TextWithIcon>
      </Button>
    </div>
  );
};

const FolderFilterList = ({ refresh }: { refresh: number }) => {
  const location = useLocation();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToUpdateFolders = checkAccess(Permission.WRITE_FOLDER);
  const [searchParams, setSearchParams] = useSearchParams(location.search);
  const selectedFolderId = searchParams.get(folderIdParamName);
  const [
    sortedAlphabeticallyIncreasingly,
    setSortedAlphabeticallyIncreasingly,
  ] = useState(true);

  const updateSearchParams = (folderId: string | undefined) => {
    const newQueryParameters: URLSearchParams = new URLSearchParams(
      searchParams,
    );
    if (folderId) {
      newQueryParameters.set(folderIdParamName, folderId);
    } else {
      newQueryParameters.delete(folderIdParamName);
    }
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

  const sortedFolders = useMemo(() => {
    return folders?.sort((a, b) => {
      if (sortedAlphabeticallyIncreasingly) {
        return a.displayName.localeCompare(b.displayName);
      } else {
        return b.displayName.localeCompare(a.displayName);
      }
    });
  }, [folders, sortedAlphabeticallyIncreasingly]);

  useEffect(() => {
    refetchFolders();
    refetchAllFlowsCount();
  }, [refresh]);

  const isInUncategorized = selectedFolderId === 'NULL';
  const isInAllFlows = isNil(selectedFolderId);

  return (
    <div className="mt-4">
      <div className="flex flex-row items-center mb-2">
        <span className="flex">{t('Folders')}</span>
        <div className="grow"></div>
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setSortedAlphabeticallyIncreasingly(
                !sortedAlphabeticallyIncreasingly,
              )
            }
          >
            {sortedAlphabeticallyIncreasingly ? (
              <ArrowUpAz className="w-4 h-4"></ArrowUpAz>
            ) : (
              <ArrowDownZA className="w-4 h-4"></ArrowDownZA>
            )}
          </Button>
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateFolders}
          >
            <CreateFolderDialog
              refetchFolders={refetchFolders}
              updateSearchParams={updateSearchParams}
            />
          </PermissionNeededTooltip>
        </div>
      </div>
      <div className="flex w-[250px] h-full flex-col gap-y-1">
        <Button
          variant="accent"
          className={cn('flex w-full justify-start bg-background pl-4 pr-0', {
            'bg-muted': isInAllFlows,
          })}
          onClick={() => updateSearchParams(undefined)}
        >
          <TextWithIcon
            icon={<TableProperties className="w-4 h-4"></TableProperties>}
            text={
              <div className="flex-grow whitespace-break-spaces break-all text-start truncate">
                {t('All flows')}
              </div>
            }
          />
          <div className="grow"></div>
          <div className="flex flex-row -space-x-4">
            <span className="size-9 flex items-center justify-center text-muted-foreground">
              {allFlowsCount}
            </span>
          </div>
        </Button>
        <Button
          variant="ghost"
          className={cn('flex w-full justify-start bg-background pl-4 pr-0', {
            'bg-accent dark:bg-accent/50': isInUncategorized,
          })}
          onClick={() => updateSearchParams('NULL')}
        >
          <TextWithIcon
            icon={<Shapes className="w-4 h-4"></Shapes>}
            text={
              <div className="flex-grow whitespace-break-spaces break-all text-start truncate">
                {t('Uncategorized')}
              </div>
            }
          />
          <div className="grow"></div>
          <div className="flex flex-row -space-x-4">
            <span className="size-9 flex items-center justify-center text-muted-foreground">
              {foldersUtils.extractUncategorizedFlows(allFlowsCount, folders)}
            </span>
          </div>
        </Button>
        <Separator />
        <ScrollArea type="auto">
          <div className="flex flex-col w-full gap-y-1 max-h-[590px]">
            {isLoading && (
              <div className="flex flex-col gap-2">
                {Array.from(Array(5)).map((_, index) => (
                  <Skeleton key={index} className="rounded-md w-full h-8" />
                ))}
              </div>
            )}
            {sortedFolders &&
              sortedFolders.map((folder) => {
                return (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    refetch={refetchFolders}
                    selectedFolderId={selectedFolderId}
                    updateSearchParams={updateSearchParams}
                  />
                );
              })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

const folderIdParamName = 'folderId';
export { FolderFilterList, folderIdParamName };
