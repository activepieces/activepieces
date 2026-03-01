import {
  BranchEdge,
  FlowActionKind,
  FlowGraphNode,
  FlowOperationRequest,
  FlowOperationType,
  flowStructureUtil,
  FlowVersion,
  isNil,
  RouterExecutionType,
} from '@activepieces/shared';
import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { Split } from 'lucide-react';
import { memo, useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

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
import { flowCanvasUtils } from '../../flow-canvas/utils/flow-canvas-utils';
import { BranchSettings } from '../branch-settings';

import { BranchesList } from './branches-list';
import BranchesToolbar from './branches-toolbar';

export const RouterSettings = memo(({ readonly }: { readonly: boolean }) => {
  const [
    step,
    branchEdges,
    applyOperation,
    setSelectedBranchIndex,
    selectedBranchIndex,
    addOperationListener,
    removeOperationListener,
  ] = useBuilderStateContext((state) => [
    flowStructureUtil.getActionOrThrow(state.selectedStep!, state.flowVersion),
    flowStructureUtil.getBranchEdges(
      state.flowVersion.graph,
      state.selectedStep!,
    ),
    state.applyOperation,
    state.setSelectedBranchIndex,
    state.selectedBranchIndex,
    state.addOperationListener,
    state.removeOperationListener,
  ]);
  const { fitView } = useReactFlow();

  const { control, setValue, formState } = useFormContext<RouterFormData>();

  //To validate array items we need to use form.trigger()
  const { insert, remove, move } = useFieldArray({
    control,
    name: 'branches',
  });
  const form = useFormContext<RouterFormData>();
  const deleteBranch = (index: number) => {
    applyOperation({
      type: FlowOperationType.DELETE_BRANCH,
      request: {
        stepName: step.id,
        branchIndex: index,
      },
    });

    setSelectedBranchIndex(null);
    fitView(flowCanvasUtils.createFocusStepInGraphParams(step.id));
  };

  useEffect(() => {
    const operationListener = (
      flowVersion: FlowVersion,
      operation: FlowOperationRequest,
    ) => {
      switch (operation.type) {
        case FlowOperationType.DELETE_BRANCH: {
          if (operation.request.stepName !== step.id) {
            return;
          }
          remove(operation.request.branchIndex);
          break;
        }
        case FlowOperationType.DUPLICATE_BRANCH:
        case FlowOperationType.ADD_BRANCH: {
          if (operation.request.stepName !== step.id) return;
          const updatedStep = flowStructureUtil.getActionOrThrow(
            operation.request.stepName,
            flowVersion,
          );
          if (updatedStep.data.kind !== FlowActionKind.ROUTER) {
            console.error(
              `Trying to duplicate a branch on a none router step! ${operation.request.stepName}`,
            );
            return;
          }
          const updatedBranchEdges = flowStructureUtil.getBranchEdges(
            flowVersion.graph,
            operation.request.stepName,
          );
          const branchEdge = updatedBranchEdges[operation.request.branchIndex];
          if (operation.type === FlowOperationType.DUPLICATE_BRANCH) {
            insert(operation.request.branchIndex + 1, {
              branchName: `${branchEdge.branchName} Copy`,
              branchType: branchEdge.branchType,
              conditions: branchEdge.conditions,
            });
          } else {
            insert(updatedBranchEdges.length - 1, {
              branchName: `Branch ${updatedBranchEdges.length}`,
              branchType: 'CONDITION',
              conditions: [[]],
            });
          }
          form.trigger();
          break;
        }
        case FlowOperationType.MOVE_BRANCH: {
          if (operation.request.stepName !== step.id) return;
          move(
            operation.request.sourceBranchIndex,
            operation.request.targetBranchIndex,
          );
          break;
        }
      }
    };

    addOperationListener(operationListener);
    return () => removeOperationListener(operationListener);
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
        <div>
          <div className="flex gap-2 mb-2 items-center">
            <Split className="w-4 h-4 rotate-180"></Split>
            <Label>{t('Branches')}</Label>
          </div>

          <BranchesList
            errors={(formState.errors.branches as unknown[]) ?? []}
            readonly={readonly}
            branchEdges={branchEdges}
            branchNameChanged={(index, name) => {
              setValue(`branches.${index}.branchName` as const, name, {
                shouldValidate: true,
              });
            }}
            deleteBranch={deleteBranch}
            moveBranch={({ sourceIndex, targetIndex }) => {
              applyOperation({
                type: FlowOperationType.MOVE_BRANCH,
                request: {
                  stepName: step.id,
                  sourceBranchIndex: sourceIndex,
                  targetBranchIndex: targetIndex,
                },
              });
            }}
            duplicateBranch={(index) => {
              applyOperation({
                type: FlowOperationType.DUPLICATE_BRANCH,
                request: {
                  stepName: step.id,
                  branchIndex: index,
                },
              });
              setSelectedBranchIndex(index + 1);
            }}
            setSelectedBranchIndex={(index) => {
              setSelectedBranchIndex(index);
              const branchEdge = branchEdges[index];
              if (branchEdge?.target) {
                fitView(
                  flowCanvasUtils.createFocusStepInGraphParams(
                    branchEdge.target,
                  ),
                );
              } else {
                fitView(
                  flowCanvasUtils.createFocusStepInGraphParams(
                    `${step.id}-big-add-button-${step.id}-branch-${index}-start-edge`,
                  ),
                );
              }
            }}
          ></BranchesList>
          {!readonly && (
            <div className="mt-2">
              <BranchesToolbar
                addButtonClicked={() => {
                  const branchCount = branchEdges.length;
                  applyOperation({
                    type: FlowOperationType.ADD_BRANCH,
                    request: {
                      stepName: step.id,
                      branchIndex: branchCount - 1,
                      branchName: `Branch ${branchCount}`,
                    },
                  });

                  setSelectedBranchIndex(branchCount - 1);
                }}
              ></BranchesToolbar>
            </div>
          )}
        </div>
      )}

      {!isNil(selectedBranchIndex) && (
        <BranchSettings
          readonly={readonly}
          key={`branches[${selectedBranchIndex}].conditions`}
          branchIndex={selectedBranchIndex}
        ></BranchSettings>
      )}
    </>
  );
});

RouterSettings.displayName = 'RouterSettings';

type BranchFormItem = Pick<
  BranchEdge,
  'branchName' | 'branchType' | 'conditions'
>;

type RouterFormData = FlowGraphNode['data'] & {
  branches?: BranchFormItem[];
};
