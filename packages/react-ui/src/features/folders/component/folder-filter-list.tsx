import { PlusIcon } from '@radix-ui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ChevronDown,
  EllipsisVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';

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
const FOLDER_ORDER_STORAGE_KEY = 'ap_folder_order';

type FolderActionProps = {
  folder: FolderDto;
  refetch: () => void;
  userHasPermissionToUpdateFolders: boolean;
};

export const FolderAction = ({
  folder,
  refetch,
  userHasPermissionToUpdateFolders,
}: FolderActionProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<'rename' | 'delete' | null>(
    null,
  );

  const handleOpenDialog = (dialog: 'rename' | 'delete') => {
    setDialogOpen(dialog);
    setIsDropdownOpen(false);
  };

  const handleDialogClose = () => {
    setDialogOpen(null);
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9" size="icon">
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateFolders}
          >
            <Button
              variant="ghost"
              size="sm"
              className="flex h-8 w-full justify-start gap-2 items-center"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDialog('rename');
              }}
            >
              <Pencil className="h-4 w-4" />
              <span>{t('Rename')}</span>
            </Button>
          </PermissionNeededTooltip>
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateFolders}
          >
            <Button
              variant="ghost"
              size="sm"
              className="flex h-8 w-full justify-start gap-2 items-center"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDialog('delete');
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="text-destructive">{t('Delete')}</span>
            </Button>
          </PermissionNeededTooltip>
        </DropdownMenuContent>
      </DropdownMenu>

      {dialogOpen === 'rename' && (
        <RenameFolderDialog
          folderId={folder.id}
          name={folder.displayName}
          onRename={refetch}
          open={true}
          onOpenChange={(open) => {
            if (!open) handleDialogClose();
          }}
        />
      )}

      {dialogOpen === 'delete' && (
        <ConfirmationDeleteDialog
          title={t('Delete {folderName}', {
            folderName: folder.displayName,
          })}
          message={t(
            'If you delete this folder, we will keep its flows and move them to Uncategorized.',
          )}
          mutationFn={async () => {
            console.info('HEllo');
            await foldersApi.delete(folder.id);
            refetch();
          }}
          entityName={folder.displayName}
          open={true}
          onOpenChange={(open) => {
            if (!open) handleDialogClose();
          }}
        />
      )}
    </>
  );
};

// Sortable folder component
const SortableFolder = ({
  folder,
  isSelected,
  onClick,
  refetch,
  userHasPermissionToUpdateFolders,
}: {
  folder: FolderDto;
  isSelected: boolean;
  onClick: () => void;
  refetch: () => void;
  userHasPermissionToUpdateFolders: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: folder.id,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  const [emoji, ...nameParts] = folder.displayName.split(' ');
  const name = nameParts.join(' ');

  // Handle container click to avoid interfering with button clicks
  const handleContainerClick = (e: React.MouseEvent) => {
    // Only apply drag listeners to container directly, not to child elements
    if (e.target === e.currentTarget) {
      // This is a direct click on the container, not on a child
      e.preventDefault();
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleContainerClick}
      className={cn(
        "relative group whitespace-nowrap h-9 flex overflow-hidden items-center border rounded-md cursor-grab active:cursor-grabbing",
        isDragging ? "opacity-60 shadow-md" : "opacity-100",
        isSelected ? "bg-secondary" : "bg-background"
      )}
    >
      <Button
        variant={isSelected ? 'secondary' : 'ghost'}
        size="sm"
        onClick={onClick}
        className="group whitespace-nowrap flex overflow-hidden items-center px-3 border-0 z-10"
      >
        <span className="mr-2">{emoji}</span>
        <span className="mr-2 flex items-center">
          {name}
          <span className="text-xs text-muted-foreground ml-1">
            ({folder.numberOfFlows})
          </span>
        </span>
      </Button>
      <div>
        <FolderAction
          folder={folder}
          refetch={refetch}
          userHasPermissionToUpdateFolders={
            userHasPermissionToUpdateFolders
          }
        />
      </div>
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
  const [showMoreFolders, setShowMoreFolders] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [folderOrder, setFolderOrder] = useState<string[]>(() => {
    const savedOrder = localStorage.getItem(FOLDER_ORDER_STORAGE_KEY);
    return savedOrder ? JSON.parse(savedOrder) : [];
  });
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const visibleFolderCount = 5;

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

  const orderedFolders = useMemo(() => {
    if (!folders) return [];
    
    const foldersCopy = [...folders];
    
    if (folderOrder.length > 0) {
      const orderMap = new Map(folderOrder.map((id, index) => [id, index]));
      
      // Sort using the order map, folders not in the map go to the end
      return foldersCopy.sort((a, b) => {
        const aIndex = orderMap.has(a.id) ? orderMap.get(a.id)! : Number.MAX_SAFE_INTEGER;
        const bIndex = orderMap.has(b.id) ? orderMap.get(b.id)! : Number.MAX_SAFE_INTEGER;
        return aIndex - bIndex;
      });
    }
    
    // Fall back to alphabetical sorting if no custom order
    return foldersCopy.sort((a, b) => {
      if (sortedAlphabeticallyIncreasingly) {
        return a.displayName.localeCompare(b.displayName);
      } else {
        return b.displayName.localeCompare(a.displayName);
      }
    });
  }, [folders, folderOrder, sortedAlphabeticallyIncreasingly]);
  
  // Separate the ordered folders into visible and more
  const visibleFolders = useMemo(() => {
    return orderedFolders.slice(0, visibleFolderCount) || [];
  }, [orderedFolders, visibleFolderCount]);
  
  const moreFolders = useMemo(() => {
    return orderedFolders.slice(visibleFolderCount) || [];
  }, [orderedFolders, visibleFolderCount]);

  useEffect(() => {
    refetchFolders();
    refetchAllFlowsCount();
  }, [refresh]);
  
  // Initialize folder order with existing folders if order is empty
  useEffect(() => {
    if (folders && folders.length > 0 && folderOrder.length === 0) {
      const newOrder = folders.sort((a, b) => 
        a.displayName.localeCompare(b.displayName)
      ).map(folder => folder.id);
      
      setFolderOrder(newOrder);
      localStorage.setItem(FOLDER_ORDER_STORAGE_KEY, JSON.stringify(newOrder));
    }
  }, [folders, folderOrder]);

  const isInUncategorized = selectedFolderId === 'NULL';
  const isInAllFlows = isNil(selectedFolderId);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeId = String(active.id);
      const overId = String(over.id);
      
      const currentIds = orderedFolders.map(folder => folder.id);
      
      const oldIndex = currentIds.indexOf(activeId);
      const newIndex = currentIds.indexOf(overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...currentIds];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, activeId);
        setFolderOrder(newOrder);
        localStorage.setItem(FOLDER_ORDER_STORAGE_KEY, JSON.stringify(newOrder));
      }
    }
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
  };

  const promoteFolder = (folderId: string) => {
    if (!folders) return;
    const isAlreadyVisible = visibleFolders.some(folder => folder.id === folderId);
    if (isAlreadyVisible) return;
    
    const newOrder = [...folderOrder];
    
    const currentIndex = newOrder.indexOf(folderId);
    if (currentIndex !== -1) {
      newOrder.splice(currentIndex, 1);
    }
    
    const insertPosition = Math.min(visibleFolderCount - 1, newOrder.length);
    newOrder.splice(insertPosition, 0, folderId);
    
    setFolderOrder(newOrder);
    localStorage.setItem(FOLDER_ORDER_STORAGE_KEY, JSON.stringify(newOrder));
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex items-center gap-2">
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
      </div>
      
      <div className="h-6 w-px bg-border mx-1"></div>
      
      <div className="flex-1 overflow-hidden">
        {!isLoading && (visibleFolders.length > 0 || (folders && folders.length > 0)) && (
          <DndContext 
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToHorizontalAxis]}
          >
            <SortableContext 
              items={isDragging 
                ? orderedFolders.map(folder => folder.id)
                : visibleFolders.map(folder => folder.id)
              } 
              strategy={horizontalListSortingStrategy}
            >
              <div className={cn(
                "flex items-center gap-2 min-w-0",
                isDragging 
                  ? "overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] whitespace-nowrap" 
                  : "flex-wrap"
              )}>
                {(isDragging ? orderedFolders : visibleFolders).map((folder) => (
                  <SortableFolder
                    key={folder.id}
                    folder={folder}
                    isSelected={selectedFolderId === folder.id}
                    onClick={() => updateSearchParams(folder.id)}
                    refetch={refetchFolders}
                    userHasPermissionToUpdateFolders={userHasPermissionToUpdateFolders}
                  />
                ))}
                
                {!isDragging && (
                  <>
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
                    
                    {moreFolders.length > 0 && (
                      <Popover open={showMoreFolders} onOpenChange={setShowMoreFolders}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <span className="text-xs font-semibold">
                              ({moreFolders.length})
                            </span>
                            more
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
                                        promoteFolder(folder.id);
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
                  </>
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export { FolderFilterList, folderIdParamName };
