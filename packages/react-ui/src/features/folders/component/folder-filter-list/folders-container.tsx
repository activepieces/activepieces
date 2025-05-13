import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { PlusIcon } from '@radix-ui/react-icons';
import { QueryObserverResult } from '@tanstack/react-query';
import { useRef, useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FolderDto } from '@activepieces/shared';

import { foldersApi } from '../../lib/folders-api';
import { CreateFolderDialog } from '../create-folder-dialog';

import { FolderActionsMenu } from './folder-actions-menu';
import { SortableFolder } from './sortable-folder';

interface FoldersContainerProps {
  folders: FolderDto[];
  selectedFolderId: string | null;
  updateSearchParams: (folderId: string | undefined) => void;
  refetchFolders: () => Promise<QueryObserverResult<FolderDto[], Error>>;
  userHasPermissionToUpdateFolders: boolean;
}

export const FoldersContainer = ({
  folders,
  selectedFolderId,
  updateSearchParams,
  refetchFolders,
  userHasPermissionToUpdateFolders,
}: FoldersContainerProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [sortableFolders, setSortableFolders] = useState<FolderDto[]>(folders);
  const [isDragging, setIsDragging] = useState(false);
  const [showMoreFolders, setShowMoreFolders] = useState(false);

  // Update sortableFolders when folders prop changes
  useEffect(() => {
    setSortableFolders(folders);
  }, [folders]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);

    if (over && active.id !== over.id) {
      setSortableFolders((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);

        if (userHasPermissionToUpdateFolders) {
          // Prepare folder orders for API call
          const folderOrders = newOrder.map((folder, index) => ({
            folderId: folder.id,
            order: index,
          }));
          foldersApi.updateOrder(folderOrders).then(() => {
            refetchFolders();
          });
        }

        return newOrder;
      });
    }
  };

  // Determine which folders to display
  const displayFolders = isDragging
    ? sortableFolders
    : sortableFolders.slice(0, 3);

  const moreFolders = sortableFolders.filter(
    (folder) =>
      !displayFolders.some((displayFolder) => displayFolder.id === folder.id),
  );

  return (
    <ScrollArea className="w-full">
      <div className="flex items-center gap-2 min-w-0">
        {sortableFolders && sortableFolders.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={sortableFolders.map((folder) => folder.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div
                ref={scrollContainerRef}
                className={cn(
                  'flex items-center gap-2 min-w-max',
                  'overflow-visible whitespace-nowrap',
                )}
              >
                {displayFolders.map((folder) => (
                  <SortableFolder
                    key={folder.id}
                    folder={folder}
                    isSelected={selectedFolderId === folder.id}
                    onClick={() => updateSearchParams(folder.id)}
                    onMouseDown={() => updateSearchParams(folder.id)}
                    refetch={refetchFolders}
                    userHasPermissionToUpdateFolders={
                      userHasPermissionToUpdateFolders
                    }
                    showActions={true}
                  />
                ))}

                {!isDragging && (
                  <FolderActionsMenu
                    moreFolders={moreFolders}
                    visibleFolders={displayFolders}
                    showMoreFolders={showMoreFolders}
                    setShowMoreFolders={setShowMoreFolders}
                    selectedFolderId={selectedFolderId}
                    updateSearchParams={updateSearchParams}
                    refetchFolders={async () => {
                      await refetchFolders();
                    }}
                    userHasPermissionToUpdateFolders={
                      userHasPermissionToUpdateFolders
                    }
                  />
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <PermissionNeededTooltip
          hasPermission={userHasPermissionToUpdateFolders}
        >
          <CreateFolderDialog
            refetchFolders={async () => {
              await refetchFolders();
            }}
            updateSearchParams={updateSearchParams}
          >
            <Button
              variant="outline"
              disabled={!userHasPermissionToUpdateFolders}
              size="icon"
              className="size-9 flex-shrink-0"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </CreateFolderDialog>
        </PermissionNeededTooltip>
      </div>
    </ScrollArea>
  );
};
