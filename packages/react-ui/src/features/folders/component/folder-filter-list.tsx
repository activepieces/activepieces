import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ArrowDownZA,
  ArrowUpAz,
  EllipsisVertical,
  Folder,
  FolderOpen,
  Pencil,
  PlusIcon,
  Shapes,
  TableProperties,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { TextWithIcon } from '@/components/ui/text-with-icon';
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

const FolderIcon = ({ isFolderOpen }: { isFolderOpen: boolean }) => {
  return isFolderOpen ? (
    <FolderOpen
      className={cn(
        'border-0 text-muted-foreground flex-shrink-0 w-4.5 h-4.5',
        {
          'text-primary': isFolderOpen,
        },
      )}
    />
  ) : (
    <Folder className=" flex-shrink-0 w-4 h-4" />
  );
};
type FolderItemProps = {
  folder: FolderDto;
  refetch: () => void;
  updateSearchParams: (folderId: string | undefined) => void;
  selectedFolderId: string | null;
  userHasPermissionToUpdateFolders: boolean;
};

const FolderItem = ({
  folder,
  refetch,
  updateSearchParams,
  selectedFolderId,
  userHasPermissionToUpdateFolders,
}: FolderItemProps) => {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  return (
    <div key={folder.id} className="group py-1">
      <Button
        variant="ghost"
        className={cn('w-full  items-center justify-start gap-2 px-4 ', {
          'bg-muted': selectedFolderId === folder.id,
        })}
        onClick={() => updateSearchParams(folder.id)}
      >
        <TextWithIcon
          className="flex-grow"
          icon={<FolderIcon isFolderOpen={selectedFolderId === folder.id} />}
          text={
            <div
              className={cn(
                'flex-grow whitespace-break-spaces break-all text-start truncate',
                {
                  'text-primary': selectedFolderId === folder.id,
                },
              )}
            >
              {folder.displayName}
            </div>
          }
        >
          <div onClick={(e) => e.stopPropagation()} className="flex flex-row ">
            <span
              className={cn('text-muted-foreground self-end', {
                'group-hover:hidden': userHasPermissionToUpdateFolders,
                invisible: isActionMenuOpen,
              })}
            >
              {folder.numberOfFlows}
            </span>
            {userHasPermissionToUpdateFolders && (
              <DropdownMenu onOpenChange={setIsActionMenuOpen} modal={true}>
                <DropdownMenuTrigger asChild>
                  <div
                    className={cn('w-0 group-hover:w-3 overflow-hidden', {
                      '!w-3': isActionMenuOpen,
                    })}
                  >
                    <EllipsisVertical className="h-5 w-5" />
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <PermissionNeededTooltip
                    hasPermission={userHasPermissionToUpdateFolders}
                  >
                    <RenameFolderDialog
                      folderId={folder.id}
                      name={folder.displayName}
                      onRename={() => refetch()}
                    >
                      <DropdownMenuItem
                        disabled={!userHasPermissionToUpdateFolders}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="flex flex-row gap-2 items-center">
                          <Pencil className="h-4 w-4" />
                          <span>{t('Rename')}</span>
                        </div>
                      </DropdownMenuItem>
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
                      <DropdownMenuItem
                        disabled={!userHasPermissionToUpdateFolders}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="flex flex-row gap-2 items-center">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="text-destructive">
                            {t('Delete')}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </ConfirmationDeleteDialog>
                  </PermissionNeededTooltip>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
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
            >
              <Button
                variant="ghost"
                disabled={!userHasPermissionToUpdateFolders}
                size="icon"
                className="mr-1"
              >
                <PlusIcon size={18} />
              </Button>
            </CreateFolderDialog>
          </PermissionNeededTooltip>
        </div>
      </div>
      <div className="flex w-[270px] h-full flex-col space-y-1">
        <Button
          variant="secondary"
          className={cn('flex w-full justify-start bg-background', {
            'bg-muted': isInAllFlows,
          })}
          onClick={() => updateSearchParams(undefined)}
        >
          <TextWithIcon
            icon={
              <TableProperties
                className={cn('w-4.5 h-4.5 -scale-100', {
                  'text-primary': isInAllFlows,
                })}
              ></TableProperties>
            }
            text={
              <div
                className={cn(
                  'flex-grow whitespace-break-spaces break-all text-start truncate',
                  {
                    'text-primary': isInAllFlows,
                  },
                )}
              >
                {t('All flows')}
              </div>
            }
          />
          <div className="grow"></div>
          <span className="text-muted-foreground">{allFlowsCount}</span>
        </Button>
        <Button
          variant="ghost"
          className={cn('flex w-full justify-start bg-background', {
            'bg-muted': isInUncategorized,
          })}
          onClick={() => updateSearchParams('NULL')}
        >
          <TextWithIcon
            icon={
              <Shapes
                className={cn('w-4.5 h-4.5', {
                  'text-primary': isInUncategorized,
                })}
              ></Shapes>
            }
            text={
              <div
                className={cn(
                  'flex-grow whitespace-break-spaces break-all text-start truncate',
                  {
                    'text-primary': isInUncategorized,
                  },
                )}
              >
                {t('Uncategorized')}
              </div>
            }
          />
          <div className="grow"></div>
          <div className="flex flex-row -space-x-4">
            <span className="visible text-muted-foreground group-hover:invisible">
              {foldersUtils.extractUncategorizedFlows(allFlowsCount, folders)}
            </span>
          </div>
        </Button>
        <Separator className="my-6" />
        <ScrollArea type="auto">
          <div className="flex flex-col w-full max-h-[590px]">
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
                    userHasPermissionToUpdateFolders={
                      userHasPermissionToUpdateFolders
                    }
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
