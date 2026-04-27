import { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { ProjectGroupedFlowList } from './project-grouped-flow-list';

export function FlowsListDialog<
  TEntry extends { flowId: string; projectId: string },
>({
  open,
  onOpenChange,
  title,
  entries,
  renderRow,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  entries: TEntry[];
  renderRow: (args: {
    flowId: string;
    entries: TEntry[];
    displayName: string;
    projectId: string;
  }) => ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {open && (
          <ProjectGroupedFlowList entries={entries} renderRow={renderRow} />
        )}
      </DialogContent>
    </Dialog>
  );
}
