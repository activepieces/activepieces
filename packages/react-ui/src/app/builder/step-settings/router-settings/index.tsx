import { memo, useEffect } from 'react';
import { t } from 'i18next';
import { useBuilderStateContext } from '../../builder-hooks';
import {
  flowHelper,
  FlowOperationType,
  isNil,
  RouterAction,
  RouterExecutionType,
} from '../../../../../../shared/src';
import { BranchSettings } from '../branch-settings';

import { useFieldArray, useFormContext } from 'react-hook-form';
import BranchesToolbar from './branches-toolbar';
import { BranchesList } from './branches-list';
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '../../../../components/ui/select';
import { Label } from '../../../../components/ui/label';
import { Split } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { newFloWUtils } from '../../flow-canvas/new/new-utils';

export const RouterSettings = memo(({ readonly }: { readonly: boolean }) => {
  const [step, applyOperation, setSelectedBranchIndex, selectedBranchIndex, setBranchDeletedCallback] =
    useBuilderStateContext((state) => [
      flowHelper.getStep(
        state.flowVersion,
        state.selectedStep!,
      )! as RouterAction,
      state.applyOperation,
      state.setSelectedBranchIndex,
      state.selectedBranchIndex,
      state.setBranchDeletedCallback,

    ]);
  const { fitView } = useReactFlow();

  const { control, setValue, formState, getValues } =
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
      () => { },
    );
    remove(index);
    setSelectedBranchIndex(null);
    fitView(newFloWUtils.createFocusStepInGraphParams(step.name));
  };

  useEffect(() => {
    setBranchDeletedCallback((branchIndex: number, stepName: string) => {
      if (step.name === stepName) {
        remove(branchIndex);
      }
    })

    return () => {
      setBranchDeletedCallback(null);
    }

  }, [])
  return (
    <>
      {isNil(selectedBranchIndex) && (
        <>
          <Label>{t('Execute')}</Label>
          <Select
            onValueChange={(val) => {
              setValue('settings.executionType', val as RouterExecutionType);
            }}
            value={`${getValues('settings.executionType')}`}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('Execute')} />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value={`${RouterExecutionType.EXECUTE_FIRST_MATCH}`}>
                {t('Only the first (left) matching branch')}
              </SelectItem>
              <SelectItem value={`${RouterExecutionType.EXECUTE_ALL_MATCH}`}>
                {t('All matching paths')}
              </SelectItem>
            </SelectContent>
          </Select>
        </>
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
              setValue(`settings.branches[${index}].branchName`, name);
            }}
            deleteBranch={deleteBranch}
            duplicateBranch={(index) => { }}
            setSelectedBranchIndex={(index) => {
              setSelectedBranchIndex(index);
              if (step.children[index]) {
                fitView(
                  newFloWUtils.createFocusStepInGraphParams(
                    step.children[index].name,
                  ),
                );
              } else {
                fitView(
                  newFloWUtils.createFocusStepInGraphParams(
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
                      },
                    },
                    () => { },
                  );

                  insert(
                    step.settings.branches.length - 1,
                    flowHelper.createEmptyPath(step.settings.branches.length),
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
          fieldName={`settings.branches[${selectedBranchIndex}].conditions`}
        ></BranchSettings>
      )}
    </>
  );
});
