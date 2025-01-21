import { GitCompareArrows, Minus, PencilIcon, Plus } from 'lucide-react';
import React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  ProjectOperationType,
  ProjectSyncPlanOperation,
} from '@activepieces/shared';
import { Button } from '@/components/ui/button';

const renderDiffInfo = (flowName: string, icon: React.ReactNode) => (
  <div className="flex items-center justify-between text-sm hover:bg-accent/20 rounded-md py-1">
    <div className="flex items-center gap-2">
      {icon}
      {flowName}
    </div>
  </div>
);

type OperationChangeProps = {
  change: ProjectSyncPlanOperation;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  compare: (flowId: string) => void;
};

export const OperationChange = React.memo(
  ({ change, selected, onSelect, compare }: OperationChangeProps) => {
    return (
      <>
        {change.type === ProjectOperationType.CREATE_FLOW && (
          <div className="flex gap-2 text-success items-center">
            <Checkbox checked={selected} onCheckedChange={onSelect} />
            {renderDiffInfo(
              change.flow.displayName,
              <Plus className="w-4 h-4 shrink-0" />,
            )}
          </div>
        )}
        {change.type === ProjectOperationType.UPDATE_FLOW && (
          <div className="flex gap-2 items-center">
            <Checkbox checked={selected} onCheckedChange={onSelect} />
            {renderDiffInfo(
              change.targetFlow.displayName,
              <PencilIcon className="w-4 h-4 shrink-0" />,
            )}
            <Button variant="outline" size="icon" onClick={() => {
              compare(change.targetFlow.id);
            }}>
              <GitCompareArrows className="w-4 h-4 shrink-0" />
            </Button>
          </div>
        )}
        {change.type === ProjectOperationType.DELETE_FLOW && (
          <div className="flex gap-2 text-destructive items-center">
            <Checkbox checked={selected} onCheckedChange={onSelect} />
            {renderDiffInfo(
              change.flow.displayName,
              <Minus className="w-4 h-4 shrink-0" />,
            )}
          </div>
        )}
      </>
    );
  },
);
OperationChange.displayName = 'OperationChange';
