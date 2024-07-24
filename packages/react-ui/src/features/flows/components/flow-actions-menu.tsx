import { PopulatedFlow } from '@activepieces/shared';
import {
  Copy,
  Download,
  EllipsisVertical,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FlowActionMenuProps {
  flow: PopulatedFlow;
  onRename: (flow: PopulatedFlow) => void;
  onDuplicate: (flowId: string) => void;
  onExport: (flowId: string) => void;
  onShare: (flow: PopulatedFlow) => void;
  onDelete: (flow: PopulatedFlow) => void;
}

const FlowActionMenu: React.FC<FlowActionMenuProps> = ({
  flow,
  onRename,
  onDuplicate,
  onExport,
  onShare,
  onDelete,
}) => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="p-2 rounded-full hover:bg-muted">
        <EllipsisVertical className="h-6 w-6" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onRename(flow)}>
          <div className="flex flex-row gap-2 items-center">
            <Pencil className="h-4 w-4" />
            <span>Rename</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(flow.id)}>
          <div className="flex flex-row gap-2 items-center">
            <Copy className="h-4 w-4" />
            <span>Duplicate</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport(flow.id)}>
          <div className="flex flex-row gap-2 items-center">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onShare(flow)}>
          <div className="flex flex-row gap-2 items-center">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(flow)}>
          <div className="flex flex-row gap-2 items-center">
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="text-destructive">Delete</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FlowActionMenu;
