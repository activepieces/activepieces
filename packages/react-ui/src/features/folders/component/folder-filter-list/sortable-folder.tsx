import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FolderDto } from '@activepieces/shared';

import { FolderAction } from './folder-action';

export type SortableFolderProps = {
  folder: FolderDto;
  isSelected: boolean;
  onClick: () => void;
  onMouseDown: () => void;
  refetch: () => void;
  userHasPermissionToUpdateFolders: boolean;
};

export const SortableFolder = ({
  folder,
  isSelected,
  onClick,
  onMouseDown,
  refetch,
  userHasPermissionToUpdateFolders,
}: SortableFolderProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folder.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: isDragging ? 'auto' : undefined,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 1 : undefined,
    boxSizing: 'border-box' as const,
  };

  const [emoji, ...nameParts] = folder.displayName.split(' ');
  const name = nameParts.join(' ');

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
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
        'relative group whitespace-nowrap h-9 flex overflow-hidden bg-blue-500 items-center border rounded-sm cursor-grab active:cursor-grabbing',
        isDragging ? 'opacity-60 shadow-md' : 'opacity-100',
        isSelected ? 'bg-secondary' : 'bg-background',
      )}
    >
      <Button
        variant={isSelected ? 'secondary' : 'ghost'}
        size="sm"
        onClick={onClick}
        onMouseDown={onMouseDown}
        className="group whitespace-nowrap flex rounded-none overflow-hidden items-center pl-3 pr-0 border-0 z-10"
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
          refetch={async () => {
            await refetch();
          }}
          userHasPermissionToUpdateFolders={userHasPermissionToUpdateFolders}
        />
      </Button>
    </div>
  );
};
