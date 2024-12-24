import { UpdateIcon } from '@radix-ui/react-icons';
import { Minus, Plus } from 'lucide-react';
import React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  ProjectOperationType,
  ProjectSyncPlanOperation,
} from '@activepieces/ee-shared';

type GitChangeProps = {
  change: ProjectSyncPlanOperation;
  selected: boolean;
  onSelect: (selected: boolean) => void;
};

export const GitChange = React.memo(
  ({ change, selected, onSelect }: GitChangeProps) => {
    const renderDiffInfo = (flowName: string) => (
      <div className="flex items-center justify-between text-sm hover:bg-accent/20 rounded-md py-1">
        <div className="flex items-center gap-2">
          {change.type === ProjectOperationType.CREATE_FLOW && (
            <Plus className="w-4 h-4 shrink-0" />
          )}
          {change.type === ProjectOperationType.UPDATE_FLOW && (
            <UpdateIcon className="w-4 h-4 shrink-0" />
          )}
          {change.type === ProjectOperationType.DELETE_FLOW && (
            <Minus className="w-4 h-4 shrink-0" />
          )}
          {flowName}
        </div>
      </div>
    );

    return (
      <div>
        {change.type === ProjectOperationType.CREATE_FLOW && (
          <div className="flex gap-2 text-success items-center">
            <Checkbox checked={selected} onCheckedChange={onSelect} />
            {renderDiffInfo(change.flow.displayName)}
          </div>
        )}
        {change.type === ProjectOperationType.UPDATE_FLOW && (
          <div className="flex gap-2 items-center">
            <Checkbox checked={selected} onCheckedChange={onSelect} />
            {renderDiffInfo(change.targetFlow.displayName)}
          </div>
        )}
        {change.type === ProjectOperationType.DELETE_FLOW && (
          <div className="flex gap-2 text-destructive items-center">
            <Checkbox checked={selected} onCheckedChange={onSelect} />
            {renderDiffInfo(change.flow.displayName)}
          </div>
        )}
      </div>
    );
  },
);
GitChange.displayName = 'GitChange';
