import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ArrowDownZA,
  ArrowUpAz,
  EllipsisVertical,
  Folder,
  FolderOpen,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { Separator } from '@/components/ui/separator';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { FolderDto, isNil, Permission } from '@activepieces/shared';

import { foldersApi } from '../lib/folders-api';
import { foldersHooks } from '../lib/folders-hooks';

import { CreateFolderDialog } from './create-folder-dialog';
import { RenameFolderDialog } from './rename-folder-dialog';
import { foldersUtils } from '../lib/folders-utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PlusIcon } from '@radix-ui/react-icons';

const folderIdParamName = 'folderId';

const FolderIcon = ({ isFolderOpen }: { isFolderOpen: boolean }) => {
  return isFolderOpen ? (
    <FolderOpen
      className={cn(
        'border-0 text-muted-foreground flex-shrink-0 w-4 h-4',
        {
          'text-primary': isFolderOpen,
        },
      )}
    />
  ) : (
    <Folder className="flex-shrink-0 w-4 h-4" />
  );
};

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
        <Button
          variant="ghost"
          className="h-8"
          size="icon"
        >
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

            <Button variant='ghost' size='sm' className="flex h-8 w-full justify-start gap-2 items-center" onClick={(e) => e.stopPropagation()}>
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

            <Button variant='ghost' size='sm' className="flex h-8 w-full justify-start gap-2 items-center" onClick={(e) => e.stopPropagation()}>
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="text-destructive">{t('Delete')}</span>
            </Button>
          </ConfirmationDeleteDialog>

        </PermissionNeededTooltip>

      </DropdownMenuContent>
    </DropdownMenu >
  );
};

const FolderFilterList = ({ refresh }: { refresh: number }) => {
  const location = useLocation();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToUpdateFolders = checkAccess(Permission.WRITE_FOLDER);
  const [searchParams, setSearchParams] = useSearchParams(location.search);
  const selectedFolderId = searchParams.get(folderIdParamName);
  const [sortedAlphabeticallyIncreasingly, setSortedAlphabeticallyIncreasingly] = useState(true);
  const [showMoreFolders, setShowMoreFolders] = useState(false);

  const updateSearchParams = (folderId: string | undefined) => {
    const newQueryParameters: URLSearchParams = new URLSearchParams(searchParams);
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
  }, [
    folders,
    sortedAlphabeticallyIncreasingly,
  ]);

  useEffect(() => {
    refetchFolders();
    refetchAllFlowsCount();
  }, [refresh]);

  const isInUncategorized = selectedFolderId === 'NULL';
  const isInAllFlows = isNil(selectedFolderId);

  const visibleFolderCount = 2;
  const visibleFolders = sortedFolders?.slice(0, visibleFolderCount) || [];
  const moreFolders = sortedFolders?.slice(visibleFolderCount) || [];

  return (
    <div className="flex items-center space-x-2">
      <Separator orientation='vertical' className='h-6' />
      <Button
        variant={isInAllFlows ? "secondary" : "ghost"}
        size="sm"
        onClick={() => updateSearchParams(undefined)}
        className="group h-8 border-dashed border"
      >
        {t(`All`)}
        <span className='text-xs font-semibold ml-1'>({allFlowsCount})</span>
      </Button>

      <Button
        variant={isInUncategorized ? "secondary" : "ghost"}
        size="sm"
        onClick={() => updateSearchParams('NULL')}
        className="group h-8 border-dashed border"
      >
        {t('Uncategorized')}

        <span className='text-xs font-semibold ml-1'>({foldersUtils.extractUncategorizedFlows(allFlowsCount, folders)})</span>

      </Button>

      {!isLoading && visibleFolders.map((folder) => (
        <Button
          key={folder.id}
          variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
          size="sm"
          onClick={() => updateSearchParams(folder.id)}
          className="group whitespace-nowrap flex overflow-hidden items-center pl-3 pr-1 h-8 border border-dashed"
        >
          <span className="mr-1">{folder.displayName}
            <span className='text-xs font-semibold ml-1'>({folder.numberOfFlows})</span>
          </span>
          <FolderAction
            folder={folder}
            refetch={refetchFolders}
            userHasPermissionToUpdateFolders={userHasPermissionToUpdateFolders}
          />
        </Button>
      ))}



      {moreFolders.length > 0 && (
        <Popover open={showMoreFolders} onOpenChange={setShowMoreFolders}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <EllipsisVertical className="h-4 w-4 mr-2" />
              more
            </Button>
          </PopoverTrigger>

          <PopoverContent align="start"
            className="min-w-[200px] max-w-[250px] break-all p-0"
          >

            <Command>
              <CommandInput placeholder="Search folders..." />
              <CommandList>
                <CommandEmpty>No folders found.</CommandEmpty>

                <ScrollArea viewPortClassName="max-h-[220px]">
                  <CommandGroup heading="Folders">
                    {moreFolders.map((folder) => (
                      <CommandItem
                        key={folder.id}
                        value={folder.displayName}
                        onSelect={() => {
                          updateSearchParams(folder.id);
                          setShowMoreFolders(false);
                        }}
                        className="flex justify-between items-center cursor-pointer h-9"
                      >
                        <div className="flex items-center">
                          <FolderIcon isFolderOpen={selectedFolderId === folder.id} />
                          <span className="ml-2 mr-1">{folder.displayName}
                            <span className='text-xs font-semibold ml-1'>({folder.numberOfFlows})</span>
                          </span>
                        </div>
                        <FolderAction
                          folder={folder}
                          refetch={refetchFolders}
                          userHasPermissionToUpdateFolders={userHasPermissionToUpdateFolders}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </ScrollArea>
              </CommandList>
            </Command>
            <Separator />
            <div className='p-1'>
              <Button
                variant='ghost'
                onClick={() => {
                  setSortedAlphabeticallyIncreasingly(!sortedAlphabeticallyIncreasingly);
                }}
                className="h-9 gap-x-2 px-2 justify-start w-full"
              >
                {sortedAlphabeticallyIncreasingly ? (
                  <ArrowUpAz className="h-4 w-4 mr-2" />
                ) : (
                  <ArrowDownZA className="h-4 w-4 mr-2" />
                )}
                <span>{t('Sort A - Z')}</span>
              </Button>

              <PermissionNeededTooltip hasPermission={userHasPermissionToUpdateFolders}>
                <CreateFolderDialog
                  hasPermissionsToUpdateFolder={userHasPermissionToUpdateFolders}
                  refetchFolders={refetchFolders}
                  updateSearchParams={updateSearchParams}
                >
                  <Button
                    variant="ghost"
                    disabled={!userHasPermissionToUpdateFolders}
                    size="sm"
                    className="h-9 gap-x-2 px-2 justify-start w-full"
                  >
                    <PlusIcon className='h-4 w-4' />
                    Create folder
                  </Button>

                </CreateFolderDialog>
              </PermissionNeededTooltip>
            </div>

          </PopoverContent>
        </Popover>
      )}

      {moreFolders.length === 0 && (
        <PermissionNeededTooltip hasPermission={userHasPermissionToUpdateFolders}>
          <CreateFolderDialog
            hasPermissionsToUpdateFolder={userHasPermissionToUpdateFolders}
            refetchFolders={refetchFolders}
            updateSearchParams={updateSearchParams}
          >
            <Button
              variant="ghost"
              disabled={!userHasPermissionToUpdateFolders}
              size="sm"
              className="h-9 gap-x-2 px-2 justify-start w-full"
            >
              <PlusIcon className='h-4 w-4' />
              Create folder
            </Button>

          </CreateFolderDialog>
        </PermissionNeededTooltip>
      )}
    </div>
  );
};

export { FolderFilterList, folderIdParamName };
