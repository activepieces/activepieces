import { UpdateIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { Minus, Plus } from 'lucide-react';
import React from 'react';

import {
  ProjectOperationType,
  ProjectSyncPlanOperation,
} from '@activepieces/ee-shared';

type GitChangeProps = {
  change: ProjectSyncPlanOperation;
};
export const GitChange = React.memo(({ change }: GitChangeProps) => {
  return (
    <>
      {change.type === ProjectOperationType.CREATE_FLOW && (
        <div className="flex gap-4 text-success-300 justify-center items-center">
          <Plus className="w-4 h-4"></Plus>
          <span className="flex-grow items-center justify-center">
            {t('Create "{flowName}" Flow', {
              flowName: change.flow.displayName,
            })}
          </span>
        </div>
      )}
      {change.type === ProjectOperationType.UPDATE_FLOW && (
        <div className="flex gap-4 text-warn-dark justify-center items-center">
          <UpdateIcon className="w-4 h-4"></UpdateIcon>
          <span className="flex-grow items-center justify-center">
            {t('Update "{flowName}" Flow', {
              flowName: change.targetFlow.displayName,
            })}
          </span>
        </div>
      )}
      {change.type === ProjectOperationType.DELETE_FLOW && (
        <div className="flex gap-4 text-destructive-300 justify-center items-center">
          <Minus className="w-4 h-4"></Minus>
          <span className="flex-grow items-center justify-center">
            {t('Delete "{flowName}" Flow', {
              flowName: change.flow.displayName,
            })}
          </span>
        </div>
      )}
    </>
  );
});
GitChange.displayName = 'GitChange';
