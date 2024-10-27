import React from 'react';
import { t } from 'i18next';
import { useBuilderStateContext } from '../../builder-hooks';
import {
  BranchExecutionType,
  flowHelper,
  FlowOperationType,
  isNil,
  RouterAction,
  RouterExecutionType,
} from '../../../../../../shared/src';
import { BranchSettings } from '../branch-settings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { InvalidStepIcon } from '@/components/custom/alert-icon';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Switch } from '../../../../components/ui/switch';
import { FormError } from '@/components/ui/form';
import PathsToolbar from './paths-toolbar';
const extractErrorMessage = (errors: unknown[], action: RouterAction) => {
  const firstInvalidPath = action.settings.branches.find(
    (_, index) => !isNil(errors[index]),
  );
  if (firstInvalidPath) {
    return t('{path} conditions are incomplete', {
      path: firstInvalidPath.branchName,
    });
  }
  return '';
};
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

    console.log(formState.errors.settings?.branches);
    const { insert, remove } = useFieldArray({
      control,
      name: 'settings.branches',
    });
    const errorMessage = extractErrorMessage(
      formState.errors.settings?.branches ?? [],
      step,
    );
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
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{branch.branchName}</span>

                      {formState.errors.settings?.branches &&
                        formState.errors.settings?.branches[index] && (
                          <InvalidStepIcon
                            size={16}
                            viewBox="0 0 16 16"
                            className="stroke-0 "
                          ></InvalidStepIcon>
                        )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {errorMessage && (
            <FormError
              formMessageId="invalid-path-error-message "
              className="text-left mt-2 animate-fade  text-warning-300 "
            >
              <span
                className="  hover:underline !cursor-pointer "
                onClick={() => {
                  const errors = formState.errors.settings?.branches ?? [];
                  const firstInvalidPathIndex =
                    step.settings.branches.findIndex(
                      (_, index) => !isNil(errors[index]),
                    );
                  if (firstInvalidPathIndex > -1) {
                    setPathIndex(firstInvalidPathIndex);
                  }
                }}
              >
                {errorMessage}
              </span>
            </FormError>
          )}
        </div>

        {!readonly && (
          <PathsToolbar
            showDeleteButton={step.settings.branches.length > 2}
            addButtonClicked={() => {
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
            deleteButtonClicked={() => {
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
                setRenderAfterRemovingFirstPath(!renderAfterRemovingFirstPath);
              }
            }}
          ></PathsToolbar>
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
