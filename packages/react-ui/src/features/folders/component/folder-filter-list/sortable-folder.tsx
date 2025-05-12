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
  refetch: () => void;
  userHasPermissionToUpdateFolders: boolean;
};

export const SortableFolder = ({
  folder,
  isSelected,
  onClick,
  refetch,
  userHasPermissionToUpdateFolders,
}: SortableFolderProps) => {
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
        "relative group whitespace-nowrap h-9 flex overflow-hidden items-center border rounded-sm cursor-grab active:cursor-grabbing",
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