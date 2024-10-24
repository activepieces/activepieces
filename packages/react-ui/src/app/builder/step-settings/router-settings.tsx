import React from 'react';
import { Button } from '../../../components/ui/button';
import { t } from 'i18next';
import { useBuilderStateContext } from '../builder-hooks';
import {
  flowHelper,
  FlowOperationType,
  RouterAction,
} from '../../../../../shared/src';

import { BranchSettings } from './branch-settings';
import { Plus, Trash } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

export const RouterSettings = React.memo(
  ({ readonly }: { readonly: boolean }) => {
    const [pathIndex, setPathIndex] = React.useState(0);
    const [step, applyOperation] = useBuilderStateContext((state) => [
      flowHelper.getStep(
        state.flowVersion,
        state.selectedStep!,
      )! as RouterAction,
      state.applyOperation,
    ]);

    return (
      <>
        {!readonly && (
          <div className="mb-2">
            <Select
              onValueChange={(val) => {
                setPathIndex(parseInt(val));
              }}
              value={`${pathIndex}`}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Path')} />
              </SelectTrigger>

              <SelectContent>
                {step.settings.branches.map((branch, index) => (
                  <SelectItem key={`${index}`} value={`${index}`}>
                    {branch.branchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2  justify-end mb-2">
          <Button
            variant={'basic'}
            className="gap-1 items-center"
            onClick={() => {
              applyOperation(
                {
                  type: FlowOperationType.ADD_PATH,
                  request: {
                    stepName: step.name,
                    pathIndex: step.settings.branches.length,
                  },
                },
                () => {},
              );
              rebuildFormSchema();
            }}
          >
            <Plus className="w-4 h-4"></Plus>
            {t('Add Path')}
          </Button>

          <Button
            variant={'basic'}
            className="text-destructive gap-1 items-center"
            size={'sm'}
            onClick={() => {
              applyOperation(
                {
                  type: FlowOperationType.DELETE_PATH,
                  request: {
                    stepName: step.name,
                    pathIndex: step.settings.branches.length - 1,
                  },
                },
                () => {},
              );
            }}
          >
            <Trash className="w-4 h-4"></Trash>
            {t('Delete Path')}
          </Button>
        </div>

        <BranchSettings
          readonly={readonly}
          key={`settings.branches[${pathIndex}].conditions`}
          fieldName={`settings.branches[${pathIndex}].conditions`}
        ></BranchSettings>
      </>
    );
  },
);
