import { PencilIcon, Plus, TrashIcon } from 'lucide-react';
import React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  FlowProjectOperationType,
  FlowProjectOperation,
} from '@activepieces/shared';

const renderDiffInfo = (flowName: string, icon: React.ReactNode) => (
  <div className="flex items-center justify-between text-sm hover:bg-accent/20 rounded-md py-1">
    <div className="flex items-center gap-2">
      {icon}
      {flowName}
    </div>
  </div>
);

type OperationChangeProps = {
  change: FlowProjectOperation;
  selected: boolean;
  onSelect: (selected: boolean) => void;
};

export const OperationChange = React.memo(
  ({ change, selected, onSelect }: OperationChangeProps) => {
    return (
      <>
        {change.type === FlowProjectOperationType.CREATE_FLOW && (
          <div className="flex gap-2 text-success items-center">
            <Checkbox checked={selected} onCheckedChange={onSelect} />
            {renderDiffInfo(
              change.flow.displayName,
              <Plus className="w-4 h-4 shrink-0" />,
            )}
          </div>
        )}
        {change.type === FlowProjectOperationType.UPDATE_FLOW && (
          <div className="flex gap-2 items-center">
            <Checkbox checked={selected} onCheckedChange={onSelect} />
            {renderDiffInfo(
              change.targetFlow.displayName,
              <PencilIcon className="w-4 h-4 shrink-0" />,
            )}
          </div>
        )}
        {change.type === FlowProjectOperationType.DELETE_FLOW && (
          <div className="flex gap-2 text-destructive items-center">
            <Checkbox checked={selected} onCheckedChange={onSelect} />
            {renderDiffInfo(
              change.flow.displayName,
              <TrashIcon className="w-4 h-4 shrink-0" />,
            )}
          </div>
        )}
      </>
    );
  },
);
OperationChange.displayName = 'OperationChange';
