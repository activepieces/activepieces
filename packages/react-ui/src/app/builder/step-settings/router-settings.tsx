import React from 'react';
import { Button } from '../../../components/ui/button';
import { t } from 'i18next';
import { useBuilderStateContext } from '../builder-hooks';
import {
  BranchExecutionType,
  flowHelper,
  FlowOperationType,
  RouterAction,
  RouterExecutionType,
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
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Switch } from '../../../components/ui/switch';

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
    const [switchState, setSwitchState] = React.useState(
      step.settings.executionType === RouterExecutionType.EXECUTE_FIRST_MATCH,
    );
    const [renderAfterRemovingFirstPath, setRenderAfterRemovingFirstPath] =
      React.useState(false);
    const { control, setValue, formState } = useFormContext<RouterAction>();
    const { insert, remove } = useFieldArray({
      control,
      name: 'settings.branches',
    });

    return (
      <>
        <div className="flex gap-2 items-center">
          <Switch
            checked={switchState}
            disabled={readonly}
            onCheckedChange={(val) => {
              if (val) {
                setValue(
                  'settings.executionType',
                  RouterExecutionType.EXECUTE_FIRST_MATCH,
                );
                setSwitchState(true);
              } else {
                setValue(
                  'settings.executionType',
                  RouterExecutionType.EXECUTE_ALL_MATCH,
                );
                setSwitchState(false);
              }
            }}
          />
          <span className="text-sm">
            {t('Execute only the first path whose conditions are met')}
          </span>
        </div>
        <div className="mb-2">
          <Select
            onValueChange={(val) => {
              //After adding a new path at the end, the value is empty string for some reason
              if (val) {
                setPathIndex(parseInt(val));
              }
            }}
            value={`${pathIndex}`}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('Path')} />
            </SelectTrigger>

            <SelectContent>
              {step.settings.branches.map((branch, index) => {
                if (branch.branchType === BranchExecutionType.FALLBACK) {
                  return null;
                }
                return (
                  <SelectItem key={`${index}`} value={`${index}`}>
                    {branch.branchName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {!readonly && (
          <div className="flex items-center gap-2  justify-end mb-2">
            <Button
              variant={'basic'}
              className="gap-1 items-center"
              disabled={readonly}
              onClick={() => {
                applyOperation(
                  {
                    type: FlowOperationType.ADD_PATH,
                    request: {
                      stepName: step.name,
                      pathIndex: pathIndex + 1,
                    },
                  },
                  () => {},
                );

                insert(
                  pathIndex + 1,
                  flowHelper.createEmptyPath(step.settings.branches.length),
                );
                setPathIndex(pathIndex + 1);
              }}
            >
              <Plus className="w-4 h-4"></Plus>
              {t('Add Path')}
            </Button>

            {step.settings.branches.length > 2 && (
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
                        pathIndex: pathIndex,
                      },
                    },
                    () => {},
                  );
                  remove(pathIndex);
                  if (pathIndex > 0) {
                    setPathIndex(pathIndex - 1);
                  } else {
                    setRenderAfterRemovingFirstPath(
                      !renderAfterRemovingFirstPath,
                    );
                  }
                }}
              >
                <Trash className="w-4 h-4"></Trash>
                {t('Delete Path')}
              </Button>
            )}
          </div>
        )}

        <BranchSettings
          readonly={readonly}
          key={`settings.branches[${pathIndex}].conditions ${renderAfterRemovingFirstPath}`}
          fieldName={`settings.branches[${pathIndex}].conditions`}
        ></BranchSettings>
      </>
    );
  },
);
