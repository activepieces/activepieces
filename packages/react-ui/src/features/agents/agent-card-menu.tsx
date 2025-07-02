import { MoreVertical, Trash2 } from 'lucide-react';
import React from 'react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AgentCardMenuProps {
  onDelete: () => Promise<void>;
  agentName: string;
}

export const AgentCardMenu: React.FC<AgentCardMenuProps> = ({
  onDelete,
  agentName,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 hover:bg-gray-100 rounded-full">
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleDeleteClick}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationDeleteDialog
        title="Delete Agent"
        message={`Are you sure you want to delete ${agentName}? This action cannot be undone.`}
        mutationFn={onDelete}
        entityName="agent"
        isDanger
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
};
