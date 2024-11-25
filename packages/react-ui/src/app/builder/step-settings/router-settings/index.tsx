import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { Split } from 'lucide-react';
import { memo, useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import {
  ActionType,
  FlowOperationRequest,
  FlowOperationType,
  flowStructureUtil,
  FlowVersion,
  isNil,
  RouterAction,
  RouterExecutionType,
} from '@activepieces/shared';

import { FormField, FormItem } from '../../../../components/ui/form';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '../../../../components/ui/select';
import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasUtils } from '../../flow-canvas/flow-canvas-utils';
import { BranchSettings } from '../branch-settings';

import { BranchesList } from './branches-list';
import BranchesToolbar from './branches-toolbar';

export const RouterSettings = memo(({ readonly }: { readonly: boolean }) => {
  const [
    step,
    applyOperation,
    setSelectedBranchIndex,
    selectedBranchIndex,
    addOperationListener,
    removeOperationListener,
  ] = useBuilderStateContext((state) => [
    flowStructureUtil.getActionOrThrow(
      state.selectedStep!,
      state.flowVersion.trigger,
    ) as RouterAction,
    state.applyOperation,
    state.setSelectedBranchIndex,
    state.selectedBranchIndex,
    state.addOperationListener,
    state.removeOperationListener,
  ]);
  const { fitView } = useReactFlow();

  const { control, setValue, formState } =
    useFormContext<Omit<RouterAction, 'children' | 'nextAction'>>();

  const { insert, remove } = useFieldArray({
    control,
    name: 'settings.branches',
  });

  const deleteBranch = (index: number) => {
    applyOperation(
      {
        type: FlowOperationType.DELETE_BRANCH,
        request: {
          stepName: step.name,
          branchIndex: index,
        },
      },
      () => {},
    );

    setSelectedBranchIndex(null);
    fitView(flowCanvasUtils.createFocusStepInGraphParams(step.name));
  };

  useEffect(() => {
    const deleteBranchListener = (
      _: FlowVersion,
      operation: FlowOperationRequest,
    ) => {
      if (operation.type === FlowOperationType.DELETE_BRANCH) {
        if (operation.request.stepName === step.name) {
          remove(operation.request.branchIndex);
        }
      }
    };

    const duplicateBranchListener = (
      flowVersion: FlowVersion,
      operation: FlowOperationRequest,
    ) => {
      if (operation.type === FlowOperationType.DUPLICATE_BRANCH) {
        const step = flowStructureUtil.getActionOrThrow(
          operation.request.stepName,
          flowVersion.trigger,
        );
        if (step.type !== ActionType.ROUTER) {
          console.error(
            `Trying to duplicate a branch on a none router step! ${operation.request.stepName}`,
          );
          return;
        }
        const branch = step.settings.branches[operation.request.branchIndex];

        if (operation.request.stepName === step.name) {
          insert(operation.request.branchIndex + 1, {
            ...branch,
            branchName: `${branch.branchName} Copy`,
          });
        }
      }
    };

    addOperationListener(deleteBranchListener);
    addOperationListener(duplicateBranchListener);

    return () => {
      removeOperationListener(deleteBranchListener);
      removeOperationListener(duplicateBranchListener);
    };
  }, []);
  return (
    <>
      {isNil(selectedBranchIndex) && (
        <FormField
          control={control}
          name="settings.executionType"
          render={({ field }) => (
            <FormItem>
              <Label>{t('Execute')}</Label>
              <Select
                disabled={field.disabled}
                onValueChange={field.onChange}
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Execute')} />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem
                    value={`${RouterExecutionType.EXECUTE_FIRST_MATCH}`}
                  >
                    {t('Only the first (left) matching branch')}
                  </SelectItem>
                  <SelectItem
                    value={`${RouterExecutionType.EXECUTE_ALL_MATCH}`}
                  >
                    {t('All matching paths from left to right')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        ></FormField>
      )}

      {isNil(selectedBranchIndex) && (
        <div className="mt-4">
          <div className="flex gap-2 mb-2 items-center">
            <Split className="w-4 h-4 rotate-180"></Split>
            <Label>{t('Branches')}</Label>
          </div>

          <BranchesList
            errors={(formState.errors.settings?.branches as unknown[]) ?? []}
            readonly={readonly}
            step={step}
            branchNameChanged={(index, name) => {
              setValue(`settings.branches.${index}.branchName` as const, name);
            }}
            deleteBranch={deleteBranch}
            duplicateBranch={(index) => {
              applyOperation(
                {
                  type: FlowOperationType.DUPLICATE_BRANCH,
                  request: {
                    stepName: step.name,
                    branchIndex: index,
                  },
                },
                () => {},
              );
              setSelectedBranchIndex(index + 1);
            }}
            setSelectedBranchIndex={(index) => {
              setSelectedBranchIndex(index);
              if (step.children[index]) {
                fitView(
                  flowCanvasUtils.createFocusStepInGraphParams(
                    step.children[index].name,
                  ),
                );
              } else {
                fitView(
                  flowCanvasUtils.createFocusStepInGraphParams(
                    `${step.name}-big-add-button-${step.name}-branch-${index}-start-edge`,
                  ),
                );
              }
            }}
          ></BranchesList>
          {!readonly && (
            <div className="mt-2">
              <BranchesToolbar
                addButtonClicked={() => {
                  applyOperation(
                    {
                      type: FlowOperationType.ADD_BRANCH,
                      request: {
                        stepName: step.name,
                        branchIndex: step.settings.branches.length - 1,
                        branchName: `Branch ${step.settings.branches.length}`,
                      },
                    },
                    () => {},
                  );

                  insert(
                    step.settings.branches.length - 1,
                    flowStructureUtil.createBranch(
                      `Branch ${step.settings.branches.length}`,
                      undefined,
                    ),
                  );
                  setSelectedBranchIndex(step.settings.branches.length - 1);
                }}
              ></BranchesToolbar>
            </div>
          )}
        </div>
      )}

      {!isNil(selectedBranchIndex) && (
        <BranchSettings
          readonly={readonly}
          key={`settings.branches[${selectedBranchIndex}].conditions`}
          branchIndex={selectedBranchIndex}
        ></BranchSettings>
      )}
    </>
  );
});

RouterSettings.displayName = 'RouterSettings';
