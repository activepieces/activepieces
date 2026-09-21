import { isNil } from '@activepieces/core-utils';
import {
  AiRouterAction,
  BranchExecutionType,
  FlowActionType,
  FlowOperationRequest,
  FlowOperationType,
  flowStructureUtil,
  FlowVersion,
} from '@activepieces/shared';
import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { Split } from 'lucide-react';
import { memo, useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { SearchableSelect } from '@/components/custom/searchable-select';

import { FormField, FormItem } from '../../../../components/ui/form';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasUtils } from '../../flow-canvas/utils/flow-canvas-utils';
import { TextInputWithMentions } from '../../piece-properties/text-input-with-mentions';
import { BranchesList } from '../router-settings/branches-list';
import BranchesToolbar from '../router-settings/branches-toolbar';

const CONFIDENCE_OPTIONS = [
  { value: '0.5', label: t('50% — maybe') },
  { value: '0.7', label: t('70% — likely') },
  { value: '0.9', label: t('90% — very likely') },
];

export const AiRouterSettings = memo(({ readonly }: { readonly: boolean }) => {
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
    ) as AiRouterAction,
    state.applyOperation,
    state.setSelectedBranchIndex,
    state.selectedBranchIndex,
    state.addOperationListener,
    state.removeOperationListener,
  ]);
  const { fitView } = useReactFlow();

  const form =
    useFormContext<Omit<AiRouterAction, 'children' | 'nextAction'>>();
  const { control, setValue, formState } = form;

  const { insert, remove, move } = useFieldArray({
    control,
    name: 'settings.branches',
  });

  const deleteBranch = (index: number) => {
    applyOperation({
      type: FlowOperationType.DELETE_BRANCH,
      request: {
        stepName: step.name,
        branchIndex: index,
      },
    });

    setSelectedBranchIndex(null);
    fitView(flowCanvasUtils.createFocusStepInGraphParams(step.name));
  };

  useEffect(() => {
    const operationListener = (
      flowVersion: FlowVersion,
      operation: FlowOperationRequest,
    ) => {
      switch (operation.type) {
        case FlowOperationType.DELETE_BRANCH: {
          if (operation.request.stepName !== step.name) {
            return;
          }
          remove(operation.request.branchIndex);
          break;
        }
        case FlowOperationType.DUPLICATE_BRANCH:
        case FlowOperationType.ADD_BRANCH: {
          if (operation.request.stepName !== step.name) return;
          const updatedStep = flowStructureUtil.getActionOrThrow(
            operation.request.stepName,
            flowVersion.trigger,
          );
          if (updatedStep.type !== FlowActionType.AI_ROUTER) {
            console.error(
              `Trying to change a route on a none ai router step! ${operation.request.stepName}`,
            );
            return;
          }
          const branch =
            updatedStep.settings.branches[operation.request.branchIndex];
          if (operation.type === FlowOperationType.DUPLICATE_BRANCH) {
            insert(operation.request.branchIndex + 1, {
              ...branch,
              branchName: `${branch.branchName} Copy`,
            });
          } else {
            insert(updatedStep.settings.branches.length - 1, {
              branchType: BranchExecutionType.CONDITION,
              branchName: `Route ${updatedStep.settings.branches.length}`,
              description: '',
            });
          }
          form.trigger();
          break;
        }
        case FlowOperationType.MOVE_BRANCH: {
          if (operation.request.stepName !== step.name) return;
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

  if (!isNil(selectedBranchIndex)) {
    const isFallback =
      step.settings.branches[selectedBranchIndex]?.branchType ===
      BranchExecutionType.FALLBACK;
    return (
      <FormField
        control={control}
        name={`settings.branches.${selectedBranchIndex}.description`}
        render={({ field }) => (
          <FormItem className="flex flex-col gap-1">
            <Label>{t('When to pick this route')}</Label>
            <Textarea
              {...field}
              value={field.value ?? ''}
              disabled={readonly}
              rows={3}
              placeholder={
                isFallback
                  ? t('Anything that fits none of the routes above')
                  : t('Payments, invoices, refunds')
              }
              onChange={(e) => {
                field.onChange(e.target.value);
                form.trigger();
              }}
            />
            <span className="text-xs text-muted-foreground">
              {t('The model reads this to decide. Be specific, not long.')}
            </span>
          </FormItem>
        )}
      />
    );
  }

  return (
    <>
      <FormField
        control={control}
        name="settings.text"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-1">
            <Label>{t('Input')}</Label>
            <TextInputWithMentions
              disabled={readonly}
              onChange={(value) => {
                field.onChange(value);
                form.trigger();
              }}
              initialValue={field.value}
            ></TextInputWithMentions>
            <span className="text-xs text-muted-foreground">
              {t('The text the model should read.')}
            </span>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="settings.question"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-1">
            <Label>{t('Question')}</Label>
            <TextInputWithMentions
              disabled={readonly}
              onChange={(value) => {
                field.onChange(value);
                form.trigger();
              }}
              initialValue={field.value}
            ></TextInputWithMentions>
            <span className="text-xs text-muted-foreground">
              {t('One question, answered by exactly one route below.')}
            </span>
          </FormItem>
        )}
      />

      <div>
        <div className="flex gap-2 mb-2 items-center">
          <Split className="w-4 h-4 rotate-180"></Split>
          <Label>{t('Routes')}</Label>
        </div>

        <BranchesList
          errors={(formState.errors.settings?.branches as unknown[]) ?? []}
          readonly={readonly}
          step={step}
          showFallbackBranch={true}
          branchNameChanged={(index, name) => {
            setValue(`settings.branches.${index}.branchName` as const, name, {
              shouldValidate: true,
            });
          }}
          deleteBranch={deleteBranch}
          moveBranch={({ sourceIndex, targetIndex }) => {
            applyOperation({
              type: FlowOperationType.MOVE_BRANCH,
              request: {
                stepName: step.name,
                sourceBranchIndex: sourceIndex,
                targetBranchIndex: targetIndex,
              },
            });
          }}
          duplicateBranch={(index) => {
            applyOperation({
              type: FlowOperationType.DUPLICATE_BRANCH,
              request: {
                stepName: step.name,
                branchIndex: index,
              },
            });
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
                applyOperation({
                  type: FlowOperationType.ADD_BRANCH,
                  request: {
                    stepName: step.name,
                    branchIndex: step.settings.branches.length - 1,
                    branchName: `Route ${step.settings.branches.length}`,
                  },
                });

                setSelectedBranchIndex(step.settings.branches.length - 1);
              }}
            ></BranchesToolbar>
          </div>
        )}
      </div>

      <FormField
        control={control}
        name="settings.minConfidence"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-1">
            <Label>{t('Confidence floor')}</Label>
            <SearchableSelect
              disabled={readonly}
              value={isNil(field.value) ? undefined : String(field.value)}
              options={CONFIDENCE_OPTIONS}
              placeholder={t('No floor')}
              onChange={(value) => {
                field.onChange(isNil(value) ? undefined : Number(value));
                form.trigger();
              }}
            />
            <span className="text-xs text-muted-foreground">
              {t('Below this, the flow takes the Otherwise route.')}
            </span>
          </FormItem>
        )}
      />
    </>
  );
});

AiRouterSettings.displayName = 'AiRouterSettings';
