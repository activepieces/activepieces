import { PlusIcon } from '@radix-ui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ArrowDownZA,
  ArrowUpAz,
  ChevronDown,
  EllipsisVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { FolderDto, isNil, Permission } from '@activepieces/shared';

import { foldersApi } from '../lib/folders-api';
import { foldersHooks } from '../lib/folders-hooks';
import { foldersUtils } from '../lib/folders-utils';

import { CreateFolderDialog } from './create-folder-dialog';
import { RenameFolderDialog } from './rename-folder-dialog';

const folderIdParamName = 'folderId';

type FolderActionProps = {
  folder: FolderDto;
  refetch: () => void;
  userHasPermissionToUpdateFolders: boolean;
};

const FolderAction = ({
  folder,
  refetch,
  userHasPermissionToUpdateFolders,
}: FolderActionProps) => {
  return (
    <DropdownMenu modal={true}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8" size="icon">
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <PermissionNeededTooltip
          hasPermission={userHasPermissionToUpdateFolders}
        >
          <RenameFolderDialog
            folderId={folder.id}
            name={folder.displayName}
            onRename={refetch}
          >
            <Button
              variant="ghost"
              size="sm"
              className="flex h-8 w-full justify-start gap-2 items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil className="h-4 w-4" />
              <span>{t('Rename')}</span>
            </Button>
          </RenameFolderDialog>
        </PermissionNeededTooltip>

        <PermissionNeededTooltip
          hasPermission={userHasPermissionToUpdateFolders}
        >
          <ConfirmationDeleteDialog
            title={t('Delete {folderName}', {
              folderName: folder.displayName,
            })}
            message={t(
              'If you delete this folder, we will keep its flows and move them to Uncategorized.',
            )}
            mutationFn={async () => {
              await foldersApi.delete(folder.id);
              refetch();
            }}
            entityName={folder.displayName}
          >
            <Button
              variant="ghost"
              size="sm"
              className="flex h-8 w-full justify-start gap-2 items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="text-destructive">{t('Delete')}</span>
            </Button>
          </ConfirmationDeleteDialog>
        </PermissionNeededTooltip>
      </DropdownMenuContent>
    </DropdownMenu>
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
  const [showMoreFolders, setShowMoreFolders] = useState(false);

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

  const visibleFolderCount = 5;
  const visibleFolders = sortedFolders?.slice(0, visibleFolderCount) || [];
  const moreFolders = sortedFolders?.slice(visibleFolderCount) || [];

  return (
    <div className="flex items-center gap-2 w-full flex-wrap">
      <Button
        variant={isInAllFlows ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => updateSearchParams(undefined)}
        className="group border"
      >
        <span className="mr-2">🗂️</span>
        {t(`All`)}
        <span className="text-xs text-muted-foreground ml-1">
          ({allFlowsCount})
        </span>
      </Button>

      <Button
        variant={isInUncategorized ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => updateSearchParams('NULL')}
        className="group border"
      >
        <span className="mr-2">📦</span>
        {t('Uncategorized')}

        <span className="text-xs text-muted-foreground ml-1">
          ({foldersUtils.extractUncategorizedFlows(allFlowsCount, folders)})
        </span>
      </Button>

      {!isLoading &&
        visibleFolders.map((folder) => {
          const [emoji, ...nameParts] = folder.displayName.split(' ');
          const name = nameParts.join(' ');

          return (
            <Button
              key={folder.id}
              variant={selectedFolderId === folder.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => updateSearchParams(folder.id)}
              className="group whitespace-nowrap flex overflow-hidden items-center pl-3 pr-1  border"
            >
              <span className="mr-2">{emoji}</span>
              <span className="mr-2 flex items-center">
                {name}
                <span className="text-xs text-muted-foreground ml-1">
                  ({folder.numberOfFlows})
                </span>
              </span>
              <FolderAction
                folder={folder}
                refetch={refetchFolders}
                userHasPermissionToUpdateFolders={
                  userHasPermissionToUpdateFolders
                }
              />
            </Button>
          );
        })}

      <PermissionNeededTooltip hasPermission={userHasPermissionToUpdateFolders}>
        <CreateFolderDialog
          refetchFolders={refetchFolders}
          updateSearchParams={updateSearchParams}
        >
          <Button
            variant="outline"
            disabled={!userHasPermissionToUpdateFolders}
            size="icon"
            className="size-9"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </CreateFolderDialog>
      </PermissionNeededTooltip>
      <Button
        variant="outline"
        className="size-9"
        size="icon"
        onClick={() => {
          setSortedAlphabeticallyIncreasingly(
            !sortedAlphabeticallyIncreasingly,
          );
        }}
        title={sortedAlphabeticallyIncreasingly ? 'Sort Z-A' : 'Sort A-Z'}
      >
        {sortedAlphabeticallyIncreasingly ? (
          <ArrowUpAz className="h-4 w-4" />
        ) : (
          <ArrowDownZA className="h-4 w-4" />
        )}
      </Button>

      {moreFolders.length > 0 && (
        <Popover open={showMoreFolders} onOpenChange={setShowMoreFolders}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <span className="text-xs font-semibold mr-1">
                ({moreFolders.length})
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="py-1 px-0 w-60">
            <Command>
              <CommandInput
                placeholder="Search folders..."
                className="h-8 mb-2"
              />
              <CommandEmpty>No folders found.</CommandEmpty>
              <CommandGroup>
                <ScrollArea viewPortClassName="max-h-[220px]">
                  {moreFolders.map((folder) => {
                    const [emoji, ...nameParts] = folder.displayName.split(' ');
                    const name = nameParts.join(' ');

                    return (
                      <CommandItem
                        key={folder.id}
                        value={folder.displayName}
                        className={cn('flex justify-between items-center h-9', {
                          'bg-secondary': folder.id === selectedFolderId,
                        })}
                        onSelect={() => {
                          updateSearchParams(folder.id);
                          setShowMoreFolders(false);
                        }}
                      >
                        <div className="flex items-center">
                          <span className="mr-2">{emoji}</span>
                          <span className="ml-2 text-sm">
                            {name}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({folder.numberOfFlows})
                            </span>
                          </span>
                        </div>
                        <FolderAction
                          folder={folder}
                          refetch={refetchFolders}
                          userHasPermissionToUpdateFolders={
                            userHasPermissionToUpdateFolders
                          }
                        />
                      </CommandItem>
                    );
                  })}
                </ScrollArea>
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export { FolderFilterList, folderIdParamName };
