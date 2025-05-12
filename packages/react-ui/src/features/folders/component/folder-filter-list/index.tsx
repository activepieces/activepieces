import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PlusIcon } from '@radix-ui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
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
import { isNil, Permission, FolderOrderItem } from '@activepieces/shared';

import { foldersHooks } from '../../lib/folders-hooks';
import { foldersUtils } from '../../lib/folders-utils';
import { foldersApi } from '../../lib/folders-api';
import { CreateFolderDialog } from '../create-folder-dialog';

import { FolderAction } from './folder-action';
import { SortableFolder } from './sortable-folder';

export const folderIdParamName = 'folderId';
const AVERAGE_FOLDER_WIDTH = 180; // Average width of folder item in pixels
const ADD_BUTTON_SPACE = 60; // Space needed for the add folder button in pixels
const MORE_BUTTON_SPACE = 100; // Space for "more" button if visible
const SAFETY_MARGIN = 50; // Extra space to prevent layout issues
const SCROLL_SPEED = 5; // Reduced speed to prevent bouncing
const SCROLL_THRESHOLD = 150; // Increased threshold for smoother scrolling

const FolderFilterList = ({ refresh }: { refresh: number }) => {
  const location = useLocation();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToUpdateFolders = checkAccess(Permission.WRITE_FOLDER);
  const [searchParams, setSearchParams] = useSearchParams(location.search);
  const selectedFolderId = searchParams.get(folderIdParamName);
  const [showMoreFolders, setShowMoreFolders] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [visibleFolderCount, setVisibleFolderCount] = useState(5);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const pageScrollPositionRef = useRef(0);
  const isAtScrollBoundaryRef = useRef({ left: false, right: false });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current !== null) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const checkScrollBoundaries = () => {
      isAtScrollBoundaryRef.current.left = window.scrollX <= 0;
      
      const maxScrollX = document.documentElement.scrollWidth - window.innerWidth;
      isAtScrollBoundaryRef.current.right = window.scrollX >= maxScrollX - 5; // 5px buffer
      
      pageScrollPositionRef.current = window.scrollX;
    };
    
    checkScrollBoundaries();
    
    window.addEventListener('scroll', checkScrollBoundaries);
    
    return () => {
      window.removeEventListener('scroll', checkScrollBoundaries);
    };
  }, []);

  useEffect(() => {
    let lastTimestamp = 0;
    const SCROLL_INTERVAL = 16; // ~60fps
    let lastAppliedDelta = 0;

    const handleScroll = (timestamp: number) => {
      if (timestamp - lastTimestamp < SCROLL_INTERVAL) {
        scrollAnimationRef.current = requestAnimationFrame(handleScroll);
        return;
      }
      
      lastTimestamp = timestamp;
      
      if (!isDragging) {
        scrollAnimationRef.current = requestAnimationFrame(handleScroll);
        return;
      }

      const mouseX = mousePositionRef.current.x;
      const windowWidth = window.innerWidth;
      
      let scrollDelta = 0;

      if (mouseX > windowWidth - SCROLL_THRESHOLD) {
        if (isAtScrollBoundaryRef.current.right) {
          scrollAnimationRef.current = requestAnimationFrame(handleScroll);
          return;
        }
        
        const distanceFromEdge = windowWidth - mouseX;
        const scrollFactor = 1 - Math.max(0, Math.min(1, distanceFromEdge / SCROLL_THRESHOLD));
        scrollDelta = Math.ceil(SCROLL_SPEED * (1 + scrollFactor * 2));
      } 
      else if (mouseX < SCROLL_THRESHOLD) {
        if (isAtScrollBoundaryRef.current.left) {
          scrollAnimationRef.current = requestAnimationFrame(handleScroll);
          return;
        }
        
        const distanceFromEdge = mouseX;
        const scrollFactor = 1 - Math.max(0, Math.min(1, distanceFromEdge / SCROLL_THRESHOLD));
        scrollDelta = -Math.ceil(SCROLL_SPEED * (1 + scrollFactor * 2));
      }

      if (scrollDelta !== 0 && (scrollDelta !== lastAppliedDelta || 
         (scrollDelta > 0 && !isAtScrollBoundaryRef.current.right) || 
         (scrollDelta < 0 && !isAtScrollBoundaryRef.current.left))) {
        
        lastAppliedDelta = scrollDelta;
        
        const beforeScroll = window.scrollX;
        
        window.scrollBy({
          left: scrollDelta,
          behavior: 'auto' 
        });
        
        if (beforeScroll === window.scrollX) {
          if (scrollDelta > 0) {
            isAtScrollBoundaryRef.current.right = true;
          } else {
            isAtScrollBoundaryRef.current.left = true;
          }
        }
      }
      
      scrollAnimationRef.current = requestAnimationFrame(handleScroll);
    };

    if (isDragging) {
      isAtScrollBoundaryRef.current = { left: window.scrollX <= 0, right: false };
      lastAppliedDelta = 0;
      scrollAnimationRef.current = requestAnimationFrame(handleScroll);
    } else if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }

    return () => {
      if (scrollAnimationRef.current !== null) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, [isDragging]);

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

    return [...folders].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [folders]);

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

  const isInUncategorized = selectedFolderId === 'NULL';
  const isInAllFlows = isNil(selectedFolderId);

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeId = String(active.id);
      const overId = String(over.id);

      const currentIds = orderedFolders.map((folder) => folder.id);

      const oldIndex = currentIds.indexOf(activeId);
      const newIndex = currentIds.indexOf(overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedFolders = [...orderedFolders];
        
        const [movedFolder] = reorderedFolders.splice(oldIndex, 1);
        
        reorderedFolders.splice(newIndex, 0, movedFolder);
        
        const updatedFolders = reorderedFolders.map((folder, index) => ({
          ...folder,
          displayOrder: index * 100,
        }));
        
        foldersHooks.useQueryClient?.setQueryData(
          foldersHooks.folderListQueryKey,
          updatedFolders
        );
        
        const folderOrders: FolderOrderItem[] = updatedFolders.map((folder, index) => ({
          folderId: folder.id,
          order: folder.displayOrder,
        }));

        try {
          await foldersApi.updateOrder(folderOrders);
        } catch (error) {
          console.error('Failed to update folder order:', error);
          refetchFolders();
        }
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
  };

  const promoteFolder = async (folderId: string) => {
    if (!folders) return;

    const isAlreadyVisible = visibleFolders.some(
      (folder) => folder.id === folderId,
    );
    if (isAlreadyVisible) return;

    const folderToPromote = folders.find(folder => folder.id === folderId);
    if (!folderToPromote) return;

    const updatedFolders = [...folders];
    
    const currentIndex = updatedFolders.findIndex(f => f.id === folderId);
    if (currentIndex === -1) return;
    
    updatedFolders.splice(currentIndex, 1);
    
    const insertPosition = Math.min(visibleFolderCount - 1, updatedFolders.length);
    
    updatedFolders.splice(insertPosition, 0, folderToPromote);
    
    const optimisticFolders = updatedFolders.map((folder, index) => ({
      ...folder,
      displayOrder: index * 100,
    }));
    
    foldersHooks.useQueryClient?.setQueryData(
      foldersHooks.folderListQueryKey,
      optimisticFolders
    );
    
    const folderOrders: FolderOrderItem[] = optimisticFolders.map((folder) => ({
      folderId: folder.id,
      order: folder.displayOrder,
    }));
    
    try {
      await foldersApi.updateOrder(folderOrders);
    } catch (error) {
      console.error('Failed to promote folder:', error);
      refetchFolders();
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const updateVisibleCount = () => {
      if (!folders || folders.length === 0) return;

      const containerWidth = containerRef.current?.clientWidth || 0;
      let reservedSpace = ADD_BUTTON_SPACE + SAFETY_MARGIN;

      if (folders.length > visibleFolderCount) {
        reservedSpace += MORE_BUTTON_SPACE;
      }

      const availableWidth = Math.max(0, containerWidth - reservedSpace);
      const estimatedCount = Math.floor(availableWidth / AVERAGE_FOLDER_WIDTH);
      const calculatedCount = Math.max(
        1,
        Math.min(estimatedCount, folders.length),
      );

      if (calculatedCount !== visibleFolderCount) {
        setVisibleFolderCount(calculatedCount);
      }
    };

    updateVisibleCount();

    window.addEventListener('resize', updateVisibleCount);

    const resizeObserver = new ResizeObserver(updateVisibleCount);
    resizeObserver.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', updateVisibleCount);
      resizeObserver.disconnect();
    };
  }, [folders, visibleFolderCount]);

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex items-center gap-2">
        <Button
          variant={isInAllFlows ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => updateSearchParams(undefined)}
          className="group border h-9"
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
          className="group border h-9"
        >
          <span className="mr-2">📦</span>
          {t('Uncategorized')}

          <span className="text-xs text-muted-foreground ml-1">
            ({foldersUtils.extractUncategorizedFlows(allFlowsCount, folders)})
          </span>
        </Button>
      </div>

      <div className="h-6 w-px bg-border mx-1"></div>

      <div className="flex-1 overflow-visible" ref={containerRef}>
        <div className="flex items-center gap-2 min-w-0">
          {!isLoading && (
            <>
              {(visibleFolders.length > 0 ||
                (folders && folders.length > 0)) && (
                <DndContext
                  sensors={sensors}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToHorizontalAxis]}
                  autoScroll={false}
                >
                  <SortableContext
                    items={
                      isDragging
                        ? orderedFolders.map((folder) => folder.id)
                        : visibleFolders.map((folder) => folder.id)
                    }
                    strategy={horizontalListSortingStrategy}
                  >
                    <div
                      ref={scrollContainerRef}
                      className={cn(
                        'flex items-center gap-2 min-w-max',
                        'overflow-visible whitespace-nowrap',
                      )}
                    >
                      {isDragging ? (
                        <div className="flex items-center gap-2 h-9 w-max">
                          {orderedFolders.map((folder) => (
                            <SortableFolder
                              key={folder.id}
                              folder={folder}
                              isSelected={selectedFolderId === folder.id}
                              onClick={() => updateSearchParams(folder.id)}
                              refetch={refetchFolders}
                              userHasPermissionToUpdateFolders={
                                userHasPermissionToUpdateFolders
                              }
                            />
                          ))}
                        </div>
                      ) : (
                        <>
                          {visibleFolders.map((folder) => (
                            <SortableFolder
                              key={folder.id}
                              folder={folder}
                              isSelected={selectedFolderId === folder.id}
                              onClick={() => updateSearchParams(folder.id)}
                              refetch={refetchFolders}
                              userHasPermissionToUpdateFolders={
                                userHasPermissionToUpdateFolders
                              }
                            />
                          ))}
                        </>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              <PermissionNeededTooltip
                hasPermission={userHasPermissionToUpdateFolders}
              >
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

              {!isLoading && !isDragging && moreFolders.length > 0 && (
                <Popover
                  open={showMoreFolders}
                  onOpenChange={setShowMoreFolders}
                >
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
                            const [emoji, ...nameParts] =
                              folder.displayName.split(' ');
                            const name = nameParts.join(' ');

                            return (
                              <CommandItem
                                key={folder.id}
                                value={folder.displayName}
                                className={cn(
                                  'flex justify-between items-center h-9',
                                  {
                                    'bg-secondary':
                                      folder.id === selectedFolderId,
                                  },
                                )}
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
      </div>
    </div>
  );
};

export { FolderFilterList };