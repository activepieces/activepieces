import { useReactFlow } from '@xyflow/react';
import { ActionType, BranchExecutionType, flowHelper, FlowOperationType, isNil, RouterAction, StepLocationRelativeToParent } from '../../../../../../shared/src';
import { cn } from '../../../../lib/utils';
import { useBuilderStateContext } from '../../builder-hooks';
import { flowUtilConsts } from '../consts';
import { flowCanvasUtils } from '../flow-canvas-utils';
import { CopyPlus, EllipsisVertical, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '../../../../components/ui/dropdown-menu';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { t } from 'i18next';

export type BranchLabelProps =
  | {
    label: string;
    targetNodeName: string;
    sourceNodeName: string;
  } & (
    | {
      stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH;
      branchIndex: number;
    }
    | {
      stepLocationRelativeToParent:
      | StepLocationRelativeToParent.INSIDE_FALSE_BRANCH
      | StepLocationRelativeToParent.INSIDE_TRUE_BRANCH;
    }
  );

export const BranchLabel = (props: BranchLabelProps) => {
  const [
    selectedStep,
    selectedBranchIndex,
    selectStepByName,
    setSelectedBranchIndex,
    step,
    applyOperation,
    branchDeletedCallback,
    branchDuplicateCallback,
    readonly
  ] = useBuilderStateContext((state) => [
    state.selectedStep,
    state.selectedBranchIndex,
    state.selectStepByName,
    state.setSelectedBranchIndex,
    flowHelper.getStep(state.flowVersion, props.sourceNodeName),
    state.applyOperation,
    state.branchDeletedCallback,
    state.branchDuplicateCallback,
    state.readonly
  ]);
  const isBranchNonInteractive = props.stepLocationRelativeToParent !==
    StepLocationRelativeToParent.INSIDE_BRANCH || step?.type === ActionType.ROUTER && step?.settings.branches[props.branchIndex]?.branchType === BranchExecutionType.FALLBACK;
  const { fitView } = useReactFlow()
  if (isNil(step)) {
    console.log('step is null')
    return <></>
  }

  return (
    <div className="h-full flex items-center justify-center ">
      <div className='bg-background' style={{
        paddingTop: flowUtilConsts.LABEL_VERTICAL_PADDING / 2 + 'px',
        paddingBottom: flowUtilConsts.LABEL_VERTICAL_PADDING / 2 + 'px',
      }}>
        <div
          className={cn(
            'flex items-center justify-center gap-0.5  items-center transition-all rounded-full  text-sm border  border-solid bg-primary-100/30  border-primary/50   px-2 text-primary/80 hover:text-primary hover:border-primary',
            {
              'border-primary text-primary':
                selectedStep === props.sourceNodeName &&
                props.stepLocationRelativeToParent ===
                StepLocationRelativeToParent.INSIDE_BRANCH &&
                props.branchIndex === selectedBranchIndex,
              'bg-accent text-foreground/70  border-accent hover:text-foreground/70 hover:bg-accent hover:border-accent cursor-default': isBranchNonInteractive
            },
          )}
          style={{
            height: flowUtilConsts.LABEL_HEIGHT + 'px',
            maxWidth: flowUtilConsts.AP_NODE_SIZE.STEP.width - 10 + 'px',
          }}
          onClick={() => {
            if (
              props.stepLocationRelativeToParent ===
              StepLocationRelativeToParent.INSIDE_BRANCH
              && !isBranchNonInteractive
            ) {
              selectStepByName(props.sourceNodeName);
              setSelectedBranchIndex(props.branchIndex);
              fitView(flowCanvasUtils.createFocusStepInGraphParams(props.targetNodeName))
            }
          }}
        >
          <div className="truncate">{props.label}</div>

          {
            !isBranchNonInteractive && !readonly &&
            <DropdownMenu modal={true}>
              <DropdownMenuTrigger asChild>
                <div className='h-5 shrink-0 border border-transparent hover:border-solid hover:border-primary-300/50 transition-all rounded-full w-5 flex items-center justify-center' onClick={(e) => e.stopPropagation()}>
                  <EllipsisVertical className="h-4 w-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}>
                <DropdownMenuItem
                  disabled={step?.settings.branches.length <= 2}
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedBranchIndex(null);
                    applyOperation(
                      {
                        type: FlowOperationType.DELETE_BRANCH,
                        request: {
                          stepName: props.sourceNodeName,
                          branchIndex: props.branchIndex,
                        },
                      },
                      () => { },
                    );
                    branchDeletedCallback?.(props.branchIndex, props.sourceNodeName);
                    selectStepByName(props.sourceNodeName)
                  }}>
                  <div className="flex cursor-pointer  flex-row gap-2 items-center">
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">{t('Delete Branch')}</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  debugger;
                  applyOperation(
                    {
                      type: FlowOperationType.DUPLICATE_BRANCH,
                      request: {
                        stepName: props.sourceNodeName,
                        branchIndex: props.branchIndex,
                      },
                    },
                    () => { },
                  );
                  branchDuplicateCallback?.({ ...step.settings.branches[props.branchIndex], branchName: `${step.settings.branches[props.branchIndex].branchName} Copy` }, props.sourceNodeName);
                  setSelectedBranchIndex(step.settings.branches.length - 1);
                }}>
                  <div className="flex cursor-pointer  flex-row gap-2 items-center">
                    <CopyPlus className="h-4 w-4" />
                    <span >{t('Duplicate Branch')}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        </div>
      </div>

    </div>
  );
};

export default BranchLabel;
